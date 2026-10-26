module;
#include <array>
#include <string>

export module service.AdminService;

import model.Stock;
import service.InventoryService;
import repository.InventoryRepository;

export class AdminService
{
private:
    InventoryRepository &repo;
    InventoryService &invService; // Dependency on InventoryService to extend functionality

public:
    AdminService (InventoryRepository &repo, InventoryService &invService)
        : repo(repo), invService(invService) {}

    std::array<Stock, 10> getAll() { return repo.getAll(); }

    std::array<Stock, 10> getStocksSortedByName()
    {
        return invService.getStocksSortedByName();
    }

    std::array<Stock, 10> getStocksSortedByQty()
    {
        return invService.getStocksSortedByQty();
    }

    std::array<Stock, 10> getStocksSortedByPrice()
    {
        return invService.getStocksSortedByPrice();
    }

    Stock* getStockByName(const std::string &name)
    {
        return repo.getStockByName(name);
    }

    bool addNewStock(const Stock &stock)
    {

    }

    bool updateStockName(const std::string &name, const std::string &newName)
    {
        Stock* updated = getStockByName(name);
        if (!updated) return false;
        updated->setName(newName);
        if (!repo.writeStocksToTxt()) return false;
        return true;
    }

    bool updateStockCount(const std::string& name, const int newQty)
    {
        return invService.updateStockCount(name, newQty);
    }

    bool updateStockPrice(const std::string &name, const double newPrice)
    {
        Stock* updated = getStockByName(name);
        if (!updated) return false;
        updated->setUnitCost(newPrice);
        if (!repo.writeStocksToTxt()) return false;
        return true;
    }

    bool removeStockByName(const std::string &name)
    {

    }
};
