#ifndef TXTUTILS_H
#define TXTUTILS_H

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include "Item.h"
#include "List.h"

inline const std::string FILENAME = "Inventory.txt";

inline List<Item> deserializeItemsToList()
{
    List<Item> items{};
    std::fstream file(FILENAME);
    if (!file.is_open())
    {
        // Create file if it doesn't exist to avoid error loop
        std::ofstream createFile(FILENAME);
        createFile.close();
        
        // Re-attempt open or just return empty
        file.open(FILENAME);
        if(!file.is_open()){
            std::cerr << "Unable to open file: " << FILENAME << std::endl;
            return items;
        }
    }
    std::string line;
    for (int i = 0; std::getline(file, line); i++)
    {
        if(line.empty()) continue;
        std::stringstream ss(line);
        std::string name, qty, unitCost;

        // Split by comma
        std::getline(ss, name, ',');
        std::getline(ss, qty, ',');
        std::getline(ss, unitCost, ',');
        
        try {
            if(!name.empty() && !unitCost.empty() && !qty.empty())
                items.add(Item(name, std::stod(unitCost), std::stoi(qty)));
        } catch(...) {
            continue; // Skip malformed lines
        }
    }
    return items;
}

inline bool serializeItemsToTxtFile(const List<Item>& items)
{
    std::ofstream file(FILENAME);
    if (!file.is_open())
    {
        std::cerr << "Unable to save to file: " << FILENAME << "\n";
        return false;
    }

    for (const auto& stock : items)
    {
        file << stock.getItemName() << ','
            << stock.getQuantity() << ','
            << stock.getUnitPrice() << "\n";
    }
    file.close();
    return true;
}

#endif