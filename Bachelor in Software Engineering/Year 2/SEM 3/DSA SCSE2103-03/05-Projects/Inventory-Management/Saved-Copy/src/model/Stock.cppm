module;
#include <string>
#include <utility>

export module model.Stock;

export class Stock
{
private:
    std::string name;
    int quantity;
    double unitCost;

public:
    Stock() = default;

    Stock(std::string name, int quantity, double unitCost)
        : name(std::move(name)), quantity(quantity), unitCost(unitCost) {}

    [[nodiscard]] std::string getName() const { return name; }

    void setName(std::string name) { this->name = std::move(name); }

    [[nodiscard]] int getQuantity() const { return quantity; }

    void setQuantity(int quantity) { this->quantity = quantity; }

    [[nodiscard]] double getUnitCost() const { return unitCost; }

    void setUnitCost(double unitCost) { this->unitCost = unitCost; }
};
