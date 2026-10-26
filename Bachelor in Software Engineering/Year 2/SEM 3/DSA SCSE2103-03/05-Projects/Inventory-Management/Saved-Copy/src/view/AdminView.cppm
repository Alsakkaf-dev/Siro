module;
#include <iostream>
#include <string>
#include <format>
#include <array>
#include <limits>
#include <cstdlib> // for exit()

export module view.AdminView;

import controller.AdminController;
import utility.InputValidator;
import model.Stock;
import utility.Algorithm;

export class AdminView
{
private:
    AdminController &adminController;

    // --- Helper Methods ---

    void clearBuffer()
    {
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }

    void printItemDetails(const Stock* stock)
    {
        if (!stock) return;
        std::cout << std::format(
            "\n"
            "----------------------------------------------------------------------\n"
            "Item Name  : {}\n"
            "Quantity   : {}\n"
            "Unit Cost  : {:.2f}\n"
            "----------------------------------------------------------------------\n",
            stock->getName(),
            stock->getQuantity(),
            stock->getUnitCost()
        );
    }

    // --- Menu Implementations ---

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
                printAllItems(adminController.getStocksSortedByName());
                break;
            case BYQTY:
                std::cout << "Sorted by Quantity" << "\n";
                printAllItems(adminController.getStocksSortedByQty());
                break;
            case BYPRICE:
                std::cout << "Sorted by Price" << "\n";
                printAllItems(adminController.getStocksSortedByPrice());
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

    void showUpdateStockDetailsMenu()
    {
        while (true)
        {
            std::cout << "\n\t\t--- UPDATE STOCK DETAILS ---\n";
            // Show list first so they know what to type
            printAllItems(adminController.getStocksSortedByName());

            std::cout << "\nEnter Item Name to Edit (or [0] to return): ";
            clearBuffer();
            std::string itemName = InputValidator::getStringInput();

            if (itemName == "0") return;

            Stock* stock = adminController.getStockByName(itemName);

            if (stock == nullptr)
            {
                std::cerr << "Error: Item '" << itemName << "' not found.\n";
                continue;
            }

            // Show current state
            std::cout << "\nCurrent Details:";
            printItemDetails(stock);

            std::cout <<
                "\nWhat would you like to update?\n"
                "[1] Item Name\n"
                "[2] Unit Cost\n"
                "[3] Quantity\n"
                "[0] Cancel\n";

            switch (promptSelection())
            {
            case 1: // Update Name
            {
                std::cout << "Enter New Name: ";
                // clearBuffer();
                std::string newName = InputValidator::getStringInput();

                if (adminController.updateStockName(itemName, newName))
                    std::cout << "\n[Success] Name updated to '" << newName << "'.\n";
                else
                    std::cerr << "\n[Error] Failed to update name (Name might be taken or invalid).\n";
                break;
            }
            case 2: // Update Cost
            {
                std::cout << "Enter New Unit Cost: ";
                // Assuming InputValidator has getDoubleInput, otherwise use cin >>
                double newCost = InputValidator::getDoubleInput();
                clearBuffer(); // Clear newline after cin >> double

                if (adminController.updateStockPrice(itemName, newCost))
                    std::cout << "\n[Success] Price updated.\n";
                else
                    std::cerr << "\n[Error] Failed to update price.\n";
                break;
            }
            case 3: // Update Quantity
            {
                std::cout << "Enter New Quantity: ";
                int newQty = InputValidator::getIntInput();

                if (adminController.updateStockCount(itemName, newQty))
                    std::cout << "\n[Success] Quantity updated.\n";
                else
                    std::cerr << "\n[Error] Failed to update quantity.\n";
                break;
            }
            case 0:
                std::cout << "Update cancelled.\n";
                break;
            default:
                displayInvalidSelectionErr();
            }
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
                return; // Return to main menu loop
            case 1:
                std::exit(0); // Terminate program
            default:
                displayInvalidSelectionErr();
            }
        }
    }

    void displayUnexpectedBehaviourErr()
    {
        std::cerr << "\t\t Something went wrong.\n";
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
            "\n\t\t|                    LOGOUT                      |"
            "\n\t\t=================================================="
            "\n\t\t|                                                |"
            "\n\t\t|        Are you sure you want to Log Out?       |"
            "\n\t\t|                    [1] Yes                     |"
            "\n\t\t|        [0] No, Return to the Admin Menu        |"
            "\n\t\t|                                                |"
            "\n\t\t==================================================\n");
        std::cout << menu;
    }

    int promptSelection()
    {
        std::cout << "\t\t Enter your selection: ";
        return InputValidator::getIntInput();
    }

public:
    explicit AdminView(AdminController &adminController) : adminController(adminController) {};

    [[noreturn]] void showMenu()
    {
        while (true)
        {
            const std::string menu = std::format(
                "\n"
                "\n\t\t=================================================="
                "\n\t\t|                   ADMIN MENU                   |"
                "\n\t\t=================================================="
                "\n\t\t|                                                |"
                "\n\t\t|              [1] View Inventory                |"
                "\n\t\t|            [2] Update Stock Details            |"
                "\n\t\t|                   [0] Logout                   |"
                "\n\t\t|                                                |"
                "\n\t\t==================================================\n");
            std::cout << menu;

            switch (promptSelection())
            {
            case 0:
                logout();
                break;
            case 1:
                handleInventorySortingLoop();
                break;
            case 2:
                showUpdateStockDetailsMenu();
                break;
            default:
                displayInvalidSelectionErr();
            }
        }
    }
};