#ifndef LIST_H
#define LIST_H

#include <memory>
#include <stdexcept>
#include <iterator>

template <typename T>
class List
{
    struct Node
    {
        T data;
        std::shared_ptr<Node> next;
        std::weak_ptr<Node> prev;

        explicit Node(const T& data) : data(data) {}
    };

    std::shared_ptr<Node> head;
    std::shared_ptr<Node> tail;

    std::shared_ptr<Node> find(const T& node) const
    {
        auto currNode = head;
        while (currNode)
        {
            if (currNode->data == node) return currNode;
            currNode = currNode->next;
        }
        return nullptr;
    }

public:
    List() = default;

    ~List() { while (head) { head = head->next; } }

    void add(const T& value)
    {
        auto newNode = std::make_shared<Node>(value);
        if (!head) { head = tail = newNode; }
        else
        {
            tail->next = newNode;
            newNode->prev = tail;
            tail = newNode;
        }
    }

    void remove(const T& value)
    {
        auto nodeToBeRemoved = find(value);
        if (!nodeToBeRemoved) return;

        if (auto prevNode = nodeToBeRemoved->prev.lock()) { prevNode->next = nodeToBeRemoved->next; }
        else { head = nodeToBeRemoved->next; }

        if (nodeToBeRemoved->next) { nodeToBeRemoved->next->prev = nodeToBeRemoved->prev; }
        else { tail = nodeToBeRemoved->prev.lock(); }
    }

    [[nodiscard]] bool contains(const T& value) const { return find(value) != nullptr; }

    T search(const T& value) const
    {
        if (auto node = find(value)) return node->data;
        throw std::runtime_error("Item not found");
    }

    [[nodiscard]] T getFirst() const
    {
        if (!head) throw std::runtime_error("List is empty");
        return head->data;
    }

    [[nodiscard]] T getLast() const
    {
        if (!tail) throw std::runtime_error("List is empty");
        return tail->data;
    }

    [[nodiscard]] bool isEmpty() const { return head == nullptr; }

    struct Iterator
    {
        using iterator_category = std::forward_iterator_tag;
        using difference_type = std::ptrdiff_t;
        using value_type = T;
        using pointer = T*;
        using reference = T&;

        std::shared_ptr<Node> current;

        T& operator*() const { return current->data; }

        Iterator& operator++()
        {
            if (current) current = current->next;
            return *this;
        }

        Iterator operator++(int)
        {
            Iterator temp = *this;
            ++*this;
            return temp;
        }

        bool operator==(const Iterator& other) const { return current.get() == other.current.get(); }
        bool operator!=(const Iterator& other) const { return !(*this == other); }

        T* operator->() const { return &current->data; }
    };

    [[nodiscard]] Iterator begin() const { return Iterator{head}; }

    [[nodiscard]] Iterator end() const { return Iterator{nullptr}; }
};

#endif