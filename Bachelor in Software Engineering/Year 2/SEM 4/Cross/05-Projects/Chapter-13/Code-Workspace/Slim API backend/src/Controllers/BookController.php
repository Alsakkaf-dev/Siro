<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\Json;
use App\Support\Validator;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Books resource.
 *
 *   GET    /api/books          public  — list, optional ?q= search (title or author)
 *   GET    /api/books/{id}     public  — single book
 *   POST   /api/books          auth    — create (owner = current user)
 *   PUT    /api/books/{id}     auth    — update (owner or admin), partial-update aware
 *   DELETE /api/books/{id}     auth    — delete (owner or admin)
 */
final class BookController
{
    private const COLUMNS = 'id, title, author, year, genre, created_by, created_at';

    public function __construct(private readonly PDO $pdo)
    {
    }

    public function index(Request $request, Response $response): Response
    {
        $query = trim((string) ($request->getQueryParams()['q'] ?? ''));

        if ($query !== '') {
            $statement = $this->pdo->prepare(
                'SELECT ' . self::COLUMNS . ' FROM books
                 WHERE title LIKE ? OR author LIKE ?
                 ORDER BY id DESC'
            );
            $like = '%' . $query . '%';
            $statement->execute([$like, $like]);
        } else {
            $statement = $this->pdo->query('SELECT ' . self::COLUMNS . ' FROM books ORDER BY id DESC');
        }

        $books = array_map([$this, 'cast'], $statement->fetchAll());

        return Json::write($response, [
            'data' => $books,
            'meta' => ['count' => count($books), 'query' => $query],
        ], 200);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $book = $this->find((int) $args['id']);
        if ($book === null) {
            return Json::write($response, ['error' => 'Book not found.'], 404);
        }
        return Json::write($response, ['data' => $book], 200);
    }

    public function store(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $body = (array) ($request->getParsedBody() ?? []);

        $validator = (new Validator($body))
            ->required('title')->max('title', 200)
            ->required('author')->max('author', 120)
            ->required('year')->integerBetween('year', 1450, (int) date('Y') + 1)
            ->max('genre', 80);

        if ($validator->fails()) {
            return Json::write($response, ['errors' => $validator->errors()], 422);
        }

        $now = gmdate('Y-m-d H:i:s');
        $statement = $this->pdo->prepare(
            'INSERT INTO books (title, author, year, genre, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([
            trim((string) $body['title']),
            trim((string) $body['author']),
            (int) $body['year'],
            $this->normalizeGenre($body['genre'] ?? null),
            (int) $user['id'],
            $now,
        ]);

        $book = $this->find((int) $this->pdo->lastInsertId());

        return Json::write($response, ['data' => $book], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        $book = $this->find((int) $args['id']);

        if ($book === null) {
            return Json::write($response, ['error' => 'Book not found.'], 404);
        }
        if (!$this->canModify($user, $book)) {
            return Json::write($response, ['error' => 'You can only modify your own books.'], 403);
        }

        $body = (array) ($request->getParsedBody() ?? []);

        // Validate only the fields that were actually provided (partial update).
        $validator = new Validator($body);
        if (array_key_exists('title', $body)) {
            $validator->required('title')->max('title', 200);
        }
        if (array_key_exists('author', $body)) {
            $validator->required('author')->max('author', 120);
        }
        if (array_key_exists('year', $body)) {
            $validator->required('year')->integerBetween('year', 1450, (int) date('Y') + 1);
        }
        if (array_key_exists('genre', $body)) {
            $validator->max('genre', 80);
        }
        if ($validator->fails()) {
            return Json::write($response, ['errors' => $validator->errors()], 422);
        }

        $fields = [];
        $values = [];
        if (array_key_exists('title', $body)) {
            $fields[] = 'title = ?';
            $values[] = trim((string) $body['title']);
        }
        if (array_key_exists('author', $body)) {
            $fields[] = 'author = ?';
            $values[] = trim((string) $body['author']);
        }
        if (array_key_exists('year', $body)) {
            $fields[] = 'year = ?';
            $values[] = (int) $body['year'];
        }
        if (array_key_exists('genre', $body)) {
            $fields[] = 'genre = ?';
            $values[] = $this->normalizeGenre($body['genre']);
        }

        if ($fields !== []) {
            $fields[] = 'updated_at = ?';
            $values[] = gmdate('Y-m-d H:i:s');
            $values[] = (int) $book['id'];

            $statement = $this->pdo->prepare(
                'UPDATE books SET ' . implode(', ', $fields) . ' WHERE id = ?'
            );
            $statement->execute($values);
        }

        return Json::write($response, ['data' => $this->find((int) $book['id'])], 200);
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        $book = $this->find((int) $args['id']);

        if ($book === null) {
            return Json::write($response, ['error' => 'Book not found.'], 404);
        }
        if (!$this->canModify($user, $book)) {
            return Json::write($response, ['error' => 'You can only delete your own books.'], 403);
        }

        $statement = $this->pdo->prepare('DELETE FROM books WHERE id = ?');
        $statement->execute([(int) $book['id']]);

        return Json::write($response, ['message' => 'Book deleted.', 'id' => (int) $book['id']], 200);
    }

    // --- Helpers -------------------------------------------------------------

    private function find(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT ' . self::COLUMNS . ' FROM books WHERE id = ?');
        $statement->execute([$id]);
        $book = $statement->fetch();

        return $book === false ? null : $this->cast($book);
    }

    /**
     * A user may modify a book if they are an admin or they own it.
     *
     * @param array<string,mixed> $user
     * @param array<string,mixed> $book
     */
    private function canModify(array $user, array $book): bool
    {
        return ($user['role'] ?? '') === 'admin'
            || (int) $book['created_by'] === (int) $user['id'];
    }

    private function normalizeGenre(mixed $genre): ?string
    {
        $genre = is_string($genre) ? trim($genre) : '';
        return $genre === '' ? null : $genre;
    }

    /**
     * Cast DB strings to the JSON types the frontend expects (ints for id,
     * year, created_by) so strict equality checks work in the UI.
     *
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function cast(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['year'] = (int) $row['year'];
        $row['created_by'] = $row['created_by'] !== null ? (int) $row['created_by'] : null;
        return $row;
    }
}
