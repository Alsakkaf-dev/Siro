module;
#include <string>
#include <fstream>
#include <iostream>
#include <list>
#include <sstream>

export module utility.TxtParser;

import model.Stock;
import model.User;
import model.UserRole;

export class TxtUtils
{
private:
    static UserRole parseUserRoleFromString(const std::string& role)
    {
        if (role == "ADMIN") return ADMIN;
        if (role == "USER") return USER;
        std::cerr << "Unrecognized user role: " << role << "\n";
        exit(0);
    }


public:
    static std::list<Stock> parseInventoryArrayFromTxt(const std::string& path)
    {
        std::list<Stock> stocks;

        std::fstream file(path);
        if (!file.is_open())
        {
            std::cerr << "Unable to open file: " << path << std::endl;
            exit(0);
        }

        std::string line;
        for (int i = 0; std::getline(file, line); i++)
        {
            std::stringstream ss(line);
            std::string name, qty, unitCost;

            // Split by comma
            std::getline(ss, name, ',');
            std::getline(ss, qty, ',');
            std::getline(ss, unitCost, ',');

            stocks.emplace_back(name, std::stoi(qty), std::stod(unitCost));
        }
        return stocks;
    }

    static std::list<User> parseUserArrayFromTxt(const std::string& path)
    {
        std::list<User> users;

        std::fstream file(path);
        if (!file.is_open())
        {
            std::cerr << "Unable to open file: " << path << "\n";
            exit(0);
        }

        std::string line;
        for (int i = 0; std::getline(file, line); i++)
        {
            std::stringstream ss(line);
            std::string username, password, role;

            // Split by comma
            std::getline(ss, username, ',');
            std::getline(ss, password, ',');
            std::getline(ss, role, ',');

            users.emplace_back(username, password, parseUserRoleFromString(role));
        }
        return users;
    }

    static bool serializeStocksArrayToTxt(const std::list<Stock>& stocks, const std::string& path)
    {
        std::ofstream file(path);
        if (!file.is_open())
        {
            std::cerr << "Unable to save to file: " << path << "\n";
            return false;
        }

        for (const auto & stock : stocks)
        {
            file << stock.getName() << ','
                << stock.getQuantity() << ','
                << stock.getUnitCost() << "\n";
        }
        file.close();
        return true;
    }
};
