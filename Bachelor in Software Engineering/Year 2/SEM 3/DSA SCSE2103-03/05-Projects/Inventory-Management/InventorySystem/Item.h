#ifndef ITEM_H
#define ITEM_H

#include <string>
#include <utility>

class Item
{
    std::string itemName;
    double unitPrice;
    int quantity;

public:
    Item(std::string name, const double unitPrice, const int qty)
        : itemName(std::move(name)), unitPrice(unitPrice), quantity(qty) {}

    [[nodiscard]] std::string getItemName() const { return itemName; }

    void setItemName(const std::string& name) { itemName = name; }

    [[nodiscard]] double getUnitPrice() const { return unitPrice; }

    void setUnitPrice(const double price) { unitPrice = price; }

    [[nodiscard]] int getQuantity() const { return quantity; }

    void setQuantity(const int qty) { quantity = qty; }

    bool operator==(const Item& other) const { return this->getItemName() == other.getItemName(); }
};

#endif