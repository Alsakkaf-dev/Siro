module;
#include <string>
#include <array>

export module controller.InventoryController;

import model.Stock;
import service.InventoryService;

export class InventoryController
{
private:
    InventoryService &service;

public:
    explicit InventoryController(InventoryService &service) : service(service) {}

    std::array<Stock, 10> getAll() { return service.getAll(); }

    std::array<Stock, 10> getStocksSortedByName()
    {
        return service.getStocksSortedByName();
    }

    std::array<Stock, 10> getStocksSortedByQty()
    {
        return service.getStocksSortedByQty();
    }

    std::array<Stock, 10> getStocksSortedByPrice()
    {
        return service.getStocksSortedByPrice();
    }

    // returns nullptr when item is not present
    Stock* getStockByName(const std::string& name)
    {
        return service.getStockByName(name);
    }

    // returns true when update process is success
    // returns false when failed.
    bool updateStockCount(const std::string& name, const int newQty)
    {
        return service.updateStockCount(name, newQty);
    }
};
