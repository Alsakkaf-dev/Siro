module;
#include <array>
#include <string>

export module controller.AdminController;

import model.Stock;
import service.AdminService;

export class AdminController
{
private:
    AdminService &service;

public:
    explicit AdminController(AdminService &service) : service(service) {}

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
    Stock* getStockByName(const std::string &name)
    {
        return service.getStockByName(name);
    }

    // returns true when update process is success
    // returns false when failed.
    bool updateStockName(const std::string &name, const std::string &newName)
    {
        return service.updateStockName(name, newName);
    }

    bool updateStockCount(const std::string& name, const int newQty)
    {
        return service.updateStockCount(name, newQty);
    }

    bool updateStockPrice(const std::string &name, const double newPrice)
    {
        return service.updateStockPrice(name, newPrice);
    }
};
