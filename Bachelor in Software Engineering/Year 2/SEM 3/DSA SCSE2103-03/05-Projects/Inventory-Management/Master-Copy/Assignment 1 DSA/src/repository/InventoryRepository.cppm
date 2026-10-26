module;
#include <iostream>
#include <string>
#include <list>
#include <ostream>

export module repository.InventoryRepository;

import model.Stock;
import utility.TxtParser;
import utility.Algorithm;

export class InventoryRepository
{
private:
    const std::string PATH = "Inventory.txt";
    std::list<Stock> stocks;

public:
    InventoryRepository()
    {
        stocks = TxtUtils::parseInventoryArrayFromTxt(PATH);
        Algorithm::sort(stocks, BYNAME);
    }

    bool addStock(const Stock &stock)
    {
        // Find the first element that is greater than the new stock
        auto it = std::ranges::find_if(stocks, [&](const Stock& s) {
            return s.getName() > stock.getName();
        });

        stocks.insert(it, stock);
        return writeStocksToTxt();
    }

    bool removeStock(const std::string &name)
    {
        auto initialSize = stocks.size();
        stocks.remove_if([&name](const Stock& s) {
            return s.getName() == name;
        });

        if (stocks.size() < initialSize) {
            return writeStocksToTxt();
        }
        return false;
    }


    [[nodiscard]] const std::list<Stock>& getAll() const { return stocks; }

    Stock* getStockByName(const std::string &name)
    {
        for (auto & stock : stocks)
        {
            if (stock.getName() == name) return &stock;
        }
        return nullptr;
    }

    [[nodiscard]] bool writeStocksToTxt() const
    {
        try {
            return TxtUtils::serializeStocksArrayToTxt(stocks, PATH);
        } catch (const std::exception& e) {
            std::cerr << "File write error: " << e.what() << std::endl;
            return false;
        }
    }
};