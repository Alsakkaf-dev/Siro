#ifndef PRIORITYQUEUE_H
#define PRIORITYQUEUE_H

#include <memory>
#include <utility>
#include <string>
#include "Item.h"

enum class PriorityType { ByName, ByPrice, ByQty };

class PriorityQueue
{
    struct Node
    {
        Item data;
        std::shared_ptr<Node> next;
        explicit Node(Item data) : data(std::move(data)) {}
    };

    std::shared_ptr<Node> head;
    std::shared_ptr<Node> tail;
    const PriorityType priority;
    int queueSize = 0;

    template <typename CompareFunc>
    void insertSorted(std::shared_ptr<Node>& newNode, CompareFunc isSmaller)
    {
        if (!head) // Safety check if called improperly, though push handles empty
        {
             head = tail = newNode;
             return;
        }

        if (isSmaller(newNode->data, head->data))
        {
            newNode->next = head;
            head = newNode;
        }
        else
        {
            auto currNode = head;
            while (currNode->next && isSmaller(currNode->next->data, newNode->data)) { currNode = currNode->next; }
            newNode->next = currNode->next;
            currNode->next = newNode;
            if (!newNode->next) { tail = newNode; }
        }
    }

public:
    explicit PriorityQueue(const PriorityType priorityType) : priority(priorityType) {}

    ~PriorityQueue() { while (head) { head = head->next; } }

    void push(const Item& data)
    {
        auto newNode = std::make_shared<Node>(data);
        if (!head)
        {
            head = tail = newNode;
            queueSize++;
            return;
        }

        switch (priority)
        {
        case PriorityType::ByName:
            insertSorted(newNode, [](const Item& a, const Item& b) { return a.getItemName() < b.getItemName(); });
            break;

        case PriorityType::ByPrice:
            insertSorted(newNode, [](const Item& a, const Item& b) { return a.getUnitPrice() < b.getUnitPrice(); });
            break;

        case PriorityType::ByQty:
            insertSorted(newNode, [](const Item& a, const Item& b) { return a.getQuantity() < b.getQuantity(); });
            break;
        }
        queueSize++;
    }

    void pop()
    {
        if (!head) return;
        head = head->next;
        if (!head) tail = nullptr;
        queueSize--;
    }

    [[nodiscard]] const Item& getFront() const { return head->data; }

    [[nodiscard]] const Item& getBack() const { return tail->data; }

    [[nodiscard]] int size() const { return queueSize; }

    [[nodiscard]] bool isEmpty() const { return head == nullptr; }

    struct Iterator
    {
        std::shared_ptr<Node> current;

        const Item& operator*() const { return current->data; }

        Iterator& operator++()
        {
            if (current) current = current->next;
            return *this;
        }

        bool operator!=(const Iterator& other) const { return current != other.current; }
    };

    [[nodiscard]] Iterator begin() const { return Iterator{head}; }

    [[nodiscard]] Iterator end() const { return Iterator{nullptr}; }
};

#endif