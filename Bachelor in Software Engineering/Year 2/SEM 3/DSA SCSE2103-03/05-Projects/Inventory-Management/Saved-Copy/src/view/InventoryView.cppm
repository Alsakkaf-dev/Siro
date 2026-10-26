module;
#include <iostream>
#include <string>
#include <format>   // Required for std::format
#include <array>    // Required for std::array
#include <limits>   // Required for numeric_limits
#include <cstdlib>  // Required for exit()

export module view.InventoryView;

import model.Stock;
import utility.Algorithm;
import controller.InventoryController;
import utility.InputValidator;

export class InventoryView
{
private:
    InventoryController& inventoryController;

    // Helper: Clear buffer before switching from cin >> to getline
    void clearBuffer() {
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }

    void showViewInventoryMenu()
    {
        const std::string menu = std::format(
            "\n"
            "\n\t\t=================================================="
            "\n\t\t|                 VIEW INVENTORY                 |"
            "\n\t\t=================================================="
            "\n\t\t|                                                |"
            "\n\t\t|               [1] View All Items               |"
            "\n\t\t|             [2] Search for an Item             |"
            "\n\t\t|           [0] Return to the Main Menu          |"
            "\n\t\t|                                                |"
            "\n\t\t==================================================\n");
        while (true)
        {
            std::cout << menu;
            switch (promptSelection())
            {
            case 1:
                handleInventorySortingLoop();
                break;
            case 2:
                displaySearchMenu();
                break;
            case 0:
                return;
            default:
                displayInvalidSelectionErr();
            }
        }
    }

    // Refactored: Split the Loop from the Printing logic
    void handleInventorySortingLoop()
    {
        SortType sortType = BYNAME; // Ensure SortType is visible via import utility.Algorithm
        while (true)
        {
            // Print based on current sort type
            switch (sortType)
            {
            case BYNAME:
                std::cout << "Sorted by Name" << "\n";
                printAllItems(inventoryController.getStocksSortedByName());
                break;
            case BYQTY:
                std::cout << "Sorted by Quantity" << "\n";
                printAllItems(inventoryController.getStocksSortedByQty());
                break;
            case BYPRICE:
                std::cout << "Sorted by Price" << "\n";
                printAllItems(inventoryController.getStocksSortedByPrice());
                break;
            }

            displaySortSelection();
            switch (promptSelection())
            {
            case 1: sortType = BYNAME; break;
            case 2: sortType = BYQTY; break;
            case 3: sortType = BYPRICE; break;
            case 0: return;
            default: displayInvalidSelectionErr();
            }
        }
    }

    void displaySortSelection()
    {
        std::cout <<
            "\n"
            "----------------------------------------------------------------------\n"
            "[1] Sort By Name [2] Sort By Quantity [3] Sort by Price\n"
            "[0] Return to Inventory Menu\n\n";
    }

    // Optimized: Pass by const reference to avoid copying the whole array
    // Note: Assuming the Controller returns std::array<Stock, 10> specifically.
    // Ideally, this should be std::span<const Stock> or std::vector.
    void printAllItems(const std::array<Stock, 10>& stocks)
    {
        for (const Stock& stock : stocks)
        {
            if (stock.getName().empty()) continue;

            std::string item = std::format(
                "\n"
                "----------------------------------------------------------------------\n"
                "Item Name  : {}\n"
                "Quantity   : {}\n"
                "Unit Cost  : {}\n"
                , stock.getName()
                , stock.getQuantity()
                , stock.getUnitCost());
            std::cout << item;
        }
    }

    void displaySearchMenu()
    {
        while (true)
        {
            std::cout << "Enter Item Name (Enter [0] to return): ";
            clearBuffer();
            std::string itemName = InputValidator::getStringInput();

            if (itemName == "0") return;

            Stock* stock = inventoryController.getStockByName(itemName);

            // FIX: Added Null Check
            if (stock != nullptr) {
                std::string item = std::format(
                    "\n"
                    "----------------------------------------------------------------------\n"
                    "Item Name  : {}\n"
                    "Quantity   : {}\n"
                    "Unit Cost  : {}\n"
                    "----------------------------------------------------------------------\n"
                    "\n"
                    , stock->getName()
                    , stock->getQuantity()
                    , stock->getUnitCost());
                std::cout << item << std::endl;
            } else {
                std::cerr << "\n[!] Item not found.\n" << std::endl;
            }
        }
    }

    void showUpdateStockCountMenu()
    {
        // Simply print the list sorted by name once, without entering the sort-loop
        std::cout << "Current Inventory:\n";
        printAllItems(inventoryController.getStocksSortedByName());

        std::cout <<
            "\n"
            "----------------------------------------------------------------------\n"
            "[1] Update Stock Count [0] Return to Inventory Menu\n\n";

        switch (promptSelection())
        {
        case 1:
        {
            std::cout << "Enter Item Name: ";
            clearBuffer();
            std::string itemName = InputValidator::getStringInput();

            Stock* stock = inventoryController.getStockByName(itemName);
            if (stock == nullptr)
            {
                std::cerr << "Item Not Found! Item Name: " << itemName << "\n";
                break;
            }

            std::string item = std::format(
                "\n"
                "----------------------------------------------------------------------\n"
                "Item Name  : {}\n"
                "Quantity   : {}\n"
                "Unit Cost  : {}\n"
                "----------------------------------------------------------------------\n"
                "\n"
                , stock->getName()
                , stock->getQuantity()
                , stock->getUnitCost());
            std::cout << item << std::endl;

            std::cout << "Enter new stock quantity: ";
            int qty = InputValidator::getIntInput();
            inventoryController.updateStockCount(itemName, qty);
            std::cout << "Stock updated successfully.\n";
            break;
        }
        case 0: return;
        default: displayInvalidSelectionErr();
        }
    }

    void logout()
    {
        while (true)
        {
            displayLogoutConfirmation();
            switch (promptSelection())
            {
            case 0:
                return;
            case 1:
                std::exit(0); // Standard exit
            default:
                displayInvalidSelectionErr();
            }
        }
    }

    void displayUnexpectedBehaviourErr()
    {
        std::cerr << "\t\t Something's wrong. How do we get here?\n";
    }

    void displayInvalidSelectionErr()
    {
        std::cerr << "\t\t Invalid selection.\n";
    }

    void displayLogoutConfirmation()
    {
        const std::string menu = std::format(
            "\n"
            "\n\t\t=================================================="
            "\n\t\t|                    MAIN MENU                   |"
            "\n\t\t=================================================="
            "\n\t\t|                                                |"
            "\n\t\t|        Are you sure you want to Log Out?       |"
            "\n\t\t|                    [1] Yes                     |"
            "\n\t\t|        [0] No, Return to the Main Menu         |"
            "\n\t\t|                                                |"
            "\n\t\t==================================================\n");
        std::cout << menu;
    }

    int promptSelection()
    {
        std::cout << "\t\t Enter your selection: ";
        // Assuming InputValidator handles invalid non-integer input gracefully
        const int selection = InputValidator::getIntInput();
        return selection;
    }

public:
    explicit InventoryView(InventoryController& controller) : inventoryController(controller) {}

    [[noreturn]] void showMenu()
    {
        const std::string menu = std::format(
            "\n"
            "\n\t\t=================================================="
            "\n\t\t|                    MAIN MENU                   |"
            "\n\t\t=================================================="
            "\n\t\t|                                                |"
            "\n\t\t|               [1] View All Items               |"
            "\n\t\t|             [2] Update Stock Count             |"
            "\n\t\t|                   [0] Logout                   |"
            "\n\t\t|                                                |"
            "\n\t\t==================================================\n");
        while (true)
        {
            std::cout << menu;
            switch (promptSelection())
            {
            case 0:
                logout();
                break;
            case 1:
                showViewInventoryMenu();
                break;
            case 2:
                showUpdateStockCountMenu();
                break;
            default:
                displayInvalidSelectionErr();
            }
        }
    }
};