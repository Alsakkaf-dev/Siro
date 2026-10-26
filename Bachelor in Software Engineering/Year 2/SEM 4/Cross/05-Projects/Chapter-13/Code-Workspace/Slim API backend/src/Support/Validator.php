<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Tiny fluent validator. Collects one human-readable message per field and
 * returns them as a { field: message } map — exactly the shape the Vue
 * frontend expects under the "errors" key.
 */
final class Validator
{
    /** @var array<string,string> */
    private array $errors = [];

    /** @param array<string,mixed> $data */
    public function __construct(private readonly array $data)
    {
    }

    public function required(string $field, ?string $label = null): self
    {
        $label ??= self::label($field);
        $value = $this->data[$field] ?? null;
        if ($value === null || (is_string($value) && trim($value) === '')) {
            $this->add($field, "{$label} is required.");
        }
        return $this;
    }

    public function email(string $field, ?string $label = null): self
    {
        $label ??= self::label($field);
        $value = (string) ($this->data[$field] ?? '');
        if ($value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->add($field, "{$label} must be a valid email address.");
        }
        return $this;
    }

    public function min(string $field, int $length, ?string $label = null): self
    {
        $label ??= self::label($field);
        $value = (string) ($this->data[$field] ?? '');
        if ($value !== '' && mb_strlen($value) < $length) {
            $this->add($field, "{$label} must be at least {$length} characters.");
        }
        return $this;
    }

    public function max(string $field, int $length, ?string $label = null): self
    {
        $label ??= self::label($field);
        $value = (string) ($this->data[$field] ?? '');
        if (mb_strlen($value) > $length) {
            $this->add($field, "{$label} must not exceed {$length} characters.");
        }
        return $this;
    }

    public function integerBetween(string $field, int $min, int $max, ?string $label = null): self
    {
        $label ??= self::label($field);
        $raw = $this->data[$field] ?? null;
        if ($raw === null || $raw === '') {
            return $this; // "required" is responsible for emptiness
        }
        if (filter_var($raw, FILTER_VALIDATE_INT) === false) {
            $this->add($field, "{$label} must be a whole number.");
            return $this;
        }
        $int = (int) $raw;
        if ($int < $min || $int > $max) {
            $this->add($field, "{$label} must be between {$min} and {$max}.");
        }
        return $this;
    }

    public function fails(): bool
    {
        return $this->errors !== [];
    }

    /** @return array<string,string> */
    public function errors(): array
    {
        return $this->errors;
    }

    private function add(string $field, string $message): void
    {
        // keep only the first error per field
        $this->errors[$field] ??= $message;
    }

    private static function label(string $field): string
    {
        return ucfirst(str_replace('_', ' ', $field));
    }
}
