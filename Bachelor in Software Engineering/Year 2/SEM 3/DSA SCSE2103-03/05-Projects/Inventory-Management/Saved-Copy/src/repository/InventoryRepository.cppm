module;
#include <string>
#include <array>
#include <ostream>

export module repository.InventoryRepository;

import model.Stock;
import utility.TxtParser;
import utility.Algorithm;

export class InventoryRepository
{
private:
    const std::string PATH = "Inventory.txt";
    std::array<Stock, 10> stocks;

public:
    InventoryRepository()
    {
        stocks = TxtUtils::parseInventoryArrayFromTxt(PATH);
        Algorithm::bubbleSort(stocks, BYNAME);
    }

    std::array<Stock, 10> getAll() { return stocks; }

    // Linear Search
    Stock* getStockByName(const std::string &name)
    {
        for (auto & stock : stocks)
        {
            if (stock.getName() == name) return &stock;
        }
        return nullptr;
    }

    bool writeStocksToTxt()
    {
        return TxtUtils::serializeStocksArrayToTxt(stocks, PATH);
    }
};
