module;
#include <array>
#include <string>

export module service.InventoryService;

import repository.InventoryRepository;

import model.Stock;
import utility.Algorithm;

export class InventoryService
{
private:
    InventoryRepository &repo;

public:
    explicit InventoryService(InventoryRepository &repo) : repo(repo) {}

    std::array<Stock, 10> getAll() { return repo.getAll(); }

    std::array<Stock, 10> getStocksSortedByName()
    {
        std::array<Stock, 10> stocks = getAll();
        Algorithm::bubbleSort(stocks, BYNAME);
        return stocks;
    }

    std::array<Stock, 10> getStocksSortedByQty()
    {
        std::array<Stock, 10> stocks = getAll();
        Algorithm::bubbleSort(stocks, BYQTY);
        return stocks;
    }

    std::array<Stock, 10> getStocksSortedByPrice()
    {
        std::array<Stock, 10> stocks = getAll();
        Algorithm::bubbleSort(stocks, BYPRICE);
        return stocks;
    }

    Stock* getStockByName(const std::string& name)
    {
        return repo.getStockByName(name);
    }

    bool updateStockCount(const std::string& name, const int newQty)
    {
        Stock* updated = getStockByName(name);
        if (!updated) return false;
        updated->setQuantity(newQty);
        if (!repo.writeStocksToTxt()) return false;
        return true;
    }
};
