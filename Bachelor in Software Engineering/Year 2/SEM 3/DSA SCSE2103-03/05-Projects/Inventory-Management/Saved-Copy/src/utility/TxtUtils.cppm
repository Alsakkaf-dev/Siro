module;
#include <array>
#include <string>
#include <fstream>
#include <iostream>
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
    static std::array<Stock, 10> parseInventoryArrayFromTxt(const std::string& path)
    {
        std::array<Stock, 10> stocks;

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

            stocks[i] = Stock(name, std::stoi(qty), std::stod(unitCost));
        }
        return stocks;
    }

    static std::array<User, 2> parseUserArrayFromTxt(const std::string& path)
    {
        std::array<User, 2> users;

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

            users[i] = User(username, password, parseUserRoleFromString(role));
        }
        return users;
    }

    static bool serializeStocksArrayToTxt(const std::array<Stock, 10>& stocks, const std::string& path)
    {
        std::ofstream file(path);
        if (!file.is_open())
        {
            std::cerr << "Unable to save to file: " << path << "\n";
            return false;
        }

        for (int i = 0; i < stocks.size(); ++i)
        {
            file << stocks.at(i).getName() << ','
                << stocks.at(i).getQuantity() << ','
                << stocks.at(i).getUnitCost() << "\n";
        }
        file.close();
        return true;
    }
};
