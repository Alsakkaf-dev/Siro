#include <string>
#include <array>
#include <iostream>
#include <ranges>
#include <format>
#include <algorithm> // Needed for std::ranges::find

// Include our new headers
#include "User.h"
#include "Item.h"
#include "List.h"
#include "PriorityQueue.h"
#include "InputValidator.h"
#include "TxtUtils.h"
#include "algorithm.h"

List<Item> items{};
UserRole role;

bool authenticate();
[[noreturn]] void adminMenu();
[[noreturn]] void userMenu();

int main()
{
    items = deserializeItemsToList();
    
    // Note: Removed the "if empty return 1" check so the program 
    // actually runs even if the file is fresh/empty.
    // if (items.isEmpty()) return 1; 

    const std::string banner = std::format(
        "\n"
        "\n=================================================="
        "\n|                                                |"
        "\n|          INVENTORY MANAGEMENT SYSTEM           |"
        "\n|                  Version 2.0                   |"
        "\n|                                                |"
        "\n--------------------------------------------------"
        "\n|                                                |"
        "\n|                    Welcome                     |"
        "\n|                                                |"
        "\n==================================================\n"
        "\nPress 'Enter' to start the system...");
    std::cout << banner;
    std::cin.get();

    if (!authenticate()) return 2;
    switch (role)
    {
    case ADMIN: adminMenu();
    case USER: userMenu();
    }
}

bool authenticate()
{
    const std::array users = {
        User("ADMIN", "ADMIN", ADMIN),
        User("USER", "USER", USER)
    };
    while (true)
    {
        std::cout << "Enter username: ";
        const std::string username = getStringInput();
        std::cout << "Enter password: ";
        const std::string password = getStringInput();

        for (const User& user : users)
        {
            if (user.getUsername() == username && user.getPassword() == password)
            {
                role = user.getUserRole();
                return true;
            }
        }
        std::cerr << "\n[!] Invalid username or password.\n";
    }
}

int promptSelection();

void viewInventory();
void addItem();
void updateItem();
void removeItem();
void logout();

[[noreturn]] void adminMenu()
{
    const std::string menu = std::format(
        "\n"
        "\n=================================================="
        "\n|                   ADMIN MENU                   |"
        "\n=================================================="
        "\n|                                                |"
        "\n|            [1] View Inventory                  |"
        "\n|            [2] Add Item                        |"
        "\n|            [3] Update Item Details             |"
        "\n|            [4] Remove an Item                  |"
        "\n|            [0] Logout                          |"
        "\n|                                                |"
        "\n==================================================\n");
    while (true)
    {
        std::cout << menu;
        switch (promptSelection())
        {
        case 1:
            viewInventory();
            break;
        case 2:
            addItem();
            break;
        case 3:
            updateItem();
            break;
        case 4:
            removeItem();
            break;
        case 0:
            logout();
            break;
        default: std::cerr << "Invalid input.\n";
        }
    }
}

[[noreturn]] void userMenu()
{
    const std::string menu = std::format(
        "\n"
        "\n=================================================="
        "\n|                    MAIN MENU                   |"
        "\n=================================================="
        "\n|                                                |"
        "\n|            [1] View Inventory                  |"
        "\n|            [2] Update Item Quantity            |"
        "\n|            [0] Logout                          |"
        "\n|                                                |"
        "\n==================================================\n");
    while (true)
    {
        std::cout << menu;
        switch (promptSelection())
        {
        case 1:
            viewInventory();
            break;
        case 2:
            updateItem();
            break;
        case 0:
            logout();
            break;
        default: std::cerr << "Invalid input.\n";
        }
    }
}

void displayAllItem();
void displaySearchMenu();

void viewInventory()
{
    const std::string menu = std::format(
        "\n"
        "\n=================================================="
        "\n|                 VIEW INVENTORY                 |"
        "\n=================================================="
        "\n|                                                |"
        "\n|            [1] View All Items                  |"
        "\n|            [2] Search for an Item              |"
        "\n|            [0] Return to the Main Menu         |"
        "\n|                                                |"
        "\n==================================================\n");
    while (true)
    {
        std::cout << menu;
        switch (promptSelection())
        {
        case 1:
            displayAllItem();
            break;
        case 2:
            displaySearchMenu();
            break;
        case 0: return;
        default: std::cerr << "Invalid input.\n";
        }
    }
}

void displayAllItem()
{
    auto priority = PriorityType::ByName;
    while (true)
    {
        // Using the sort function from algorithm.h
        List<Item> sortedList = sort(items, priority);
        
        for (const Item& item : sortedList)
        {
            if (item.getItemName().empty()) continue;
            std::string i = std::format(
                "\n"
                "----------------------------------------------------------------------\n"
                "Item Name  : {}\n"
                "Quantity   : {}\n"
                "Unit Cost  : {}\n"
                , item.getItemName()
                , item.getQuantity()
                , item.getUnitPrice());
            std::cout << i;
        }

        std::cout << "\n----------------------------------------------------------------------\n"
            << "[1] Sort By Name [2] Sort By Quantity [3] Sort by Price\n"
            << "[0] Return to Inventory Menu\n\n";
        switch (promptSelection())
        {
        case 1:
            priority = PriorityType::ByName;
            break;
        case 2:
            priority = PriorityType::ByQty;
            break;
        case 3:
            priority = PriorityType::ByPrice;
            break;
        case 0: return;
        default: std::cerr << "Invalid input.\n";
        }
    }
}

void displaySearchMenu()
{
    while (true)
    {
        std::cout << "Enter Item Name (Enter [0] to return): ";
        std::string itemName = getStringInput();

        if (itemName == "0") return;

        // Using std::ranges::find with projection
        if (auto item = std::ranges::find(items, itemName, &Item::getItemName); item != items.end())
        {
            std::string i = std::format(
                "\n"
                "----------------------------------------------------------------------\n"
                "Item Name  : {}\n"
                "Quantity   : {}\n"
                "Unit Cost  : {}\n"
                "----------------------------------------------------------------------\n"
                "\n"
                , item->getItemName()
                , item->getQuantity()
                , item->getUnitPrice());
            std::cout << i << "\n";
        }
        else { std::cerr << "\n[!] Item not found.\n" << std::endl; }
    }
}

void addItem()
{
    std::cout << "Enter Item Name: ";
    std::string itemName = getStringInput();
    std::cout << "Enter Quantity: ";
    int quantity = getIntInput();
    std::cout << "Enter Price per Unit: ";
    double unitPrice = getDoubleInput();
    while (true)
    {
        const std::string i = std::format(
            "\n"
            "----------------------------------------------------------------------\n"
            "Item Name  : {}\n"
            "Quantity   : {}\n"
            "Unit Cost  : {}\n"
            "----------------------------------------------------------------------\n"
            , itemName
            , quantity
            , unitPrice);
        std::cout << i;
        std::cout << "[1] Edit item name [2] Edit quantity [3] Edit unit price\n"
            << "[4] Confirm & save item\n"
            << "[0] Cancel & return to Inventory Menu\n\n";

        switch (promptSelection())
        {
        case 1: std::cout << "Enter Item Name: ";
            itemName = getStringInput();
            break;
        case 2: std::cout << "Enter Quantity: ";
            quantity = getIntInput();
            break;
        case 3: std::cout << "Enter Price per Unit: ";
            unitPrice = getDoubleInput();
            break;
        case 4: items.add(Item(itemName, unitPrice, quantity));
            serializeItemsToTxtFile(items);
            return;
        case 0: return;
        default: std::cerr << "Invalid input.\n";
        }
    }
}

void updateItem()
{
    while (true)
    {
        std::cout << "Enter Item Name(Enter [0] to return): ";
        std::string itemName = getStringInput();
        if (itemName == "0") return;
        if (auto item = std::ranges::find(items, itemName, &Item::getItemName); item == items.end())
        {
            std::cerr << "\n[!] Item not found.\n" << std::endl;
        }
        else
        {
            std::string i = std::format(
                "\n"
                "----------------------------------------------------------------------\n"
                "Item Name  : {}\n"
                "Quantity   : {}\n"
                "Unit Cost  : {}\n"
                "----------------------------------------------------------------------\n"
                , item->getItemName()
                , item->getQuantity()
                , item->getUnitPrice());
            std::cout << i << "\n";
            if (role == ADMIN)
            {
                std::cout
                    << "[1] Edit item name [2] Edit quantity [3] Edit unit price\n"
                    << "[0] Cancel & return to Inventory Menu\n\n";

                switch (promptSelection())
                {
                case 1: std::cout << "Enter New Item Name: ";
                    item->setItemName(getStringInput());
                    break;
                case 2: std::cout << "Enter New Quantity: ";
                    item->setQuantity(getIntInput());
                    break;
                case 3: std::cout << "Enter New Price per Unit: ";
                    item->setUnitPrice(getDoubleInput());
                    break;
                case 0: return;
                default: std::cerr << "Invalid input.\n";
                }
                serializeItemsToTxtFile(items);
            }
            else
            {
                std::cout
                    << "[1] Edit quantity\n"
                    << "[0] Cancel & return to Inventory Menu\n\n";

                switch (promptSelection())
                {
                case 1: std::cout << "Enter New Quantity: ";
                    item->setQuantity(getIntInput());
                    serializeItemsToTxtFile(items);
                    break;
                case 0: return;
                default: std::cerr << "Invalid input.\n";
                }
            }
        }
    }
}

void removeItem()
{
    while (true)
    {
        std::cout << "Enter Item Name(Enter [0] to return): ";
        std::string itemName = getStringInput();
        if (itemName == "0") return;
        if (auto item = std::ranges::find(items, itemName, &Item::getItemName); item == items.end())
        {
            std::cerr << "\n[!] Item not found.\n" << std::endl;
        }
        else
        {
            std::string i = std::format(
                "\n"
                "----------------------------------------------------------------------\n"
                "Item Name  : {}\n"
                "Quantity   : {}\n"
                "Unit Cost  : {}\n"
                "----------------------------------------------------------------------\n"
                , item->getItemName()
                , item->getQuantity()
                , item->getUnitPrice());
            std::cout << i;
            std::cout
                << "[1] Confirm Item Removal\n"
                << "[0] Cancel & return to Inventory Menu\n\n";

            switch (promptSelection())
            {
            case 1:
                items.remove(*item);
                serializeItemsToTxtFile(items);
                std::cout << "Item Successfully Removed\n";
                break;
            case 0: return;
            default: std::cerr << "Invalid input.\n";
            }
        }
    }
}

void logout()
{
    const std::string menu = std::format(
        "\n"
        "\n=================================================="
        "\n|                     LOGOUT                     |"
        "\n=================================================="
        "\n|                                                |"
        "\n|        Are you sure you want to Log Out?       |"
        "\n|                                                |"
        "\n|        [1] Yes                                 |"
        "\n|        [0] No, Return to the Main Menu         |"
        "\n|                                                |"
        "\n==================================================\n");
    while (true)
    {
        std::cout << menu;
        switch (promptSelection())
        {
        case 0: return;
        case 1: std::exit(0);
        default: std::cerr << "Invalid input.\n";
        }
    }
}

int promptSelection()
{
    std::cout << " Enter your selection: ";
    const int selection = getIntInput();
    return selection;
}