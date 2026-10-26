#include <string>
#include <array>
#include <list>
#include <fstream>
#include <iostream>
#include <sstream>
#include <ranges>
#include <utility>
#include <format>

enum UserRole { ADMIN, USER };

struct User
{
    User(std::string user, std::string pass, const UserRole role)
        : username(std::move(user)), password(std::move(pass)), role(role) {}

    [[nodiscard]] std::string getUsername() const { return username; }

    [[nodiscard]] std::string getPassword() const { return password; }

    [[nodiscard]] UserRole getUserRole() const { return role; }

private:
    std::string username;
    std::string password;
    UserRole role;
};

struct Item
{
    Item(std::string name, const double unitPrice, const int qty)
        : itemName(std::move(name)), unitPrice(unitPrice), quantity(qty) {}

    [[nodiscard]] std::string getItemName() const { return itemName; }

    void setItemName(const std::string& name) { itemName = name; }

    [[nodiscard]] double getUnitPrice() const { return unitPrice; }

    void setUnitPrice(const double price) { unitPrice = price; }

    [[nodiscard]] int getQuantity() const { return quantity; }

    void setQuantity(const int qty) { quantity = qty; }

private:
    std::string itemName;
    double unitPrice;
    int quantity;
};

std::list<Item> items{};
UserRole role;

int getIntInput();
double getDoubleInput();
std::string getStringInput(const std::string& prompt = "");

bool deserializeItemsToList();
bool serializeItemsToTxtFile();

bool authenticate();
[[noreturn]] void adminMenu();
[[noreturn]] void userMenu();

int main()
{
    if (!deserializeItemsToList()) return 1;
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
    case 0: adminMenu();
    case 1: userMenu();
    }
}

const std::string FILENAME = "Inventory.txt";

bool deserializeItemsToList()
{
    std::fstream file(FILENAME);
    if (!file.is_open())
    {
        std::cerr << "Unable to open file: " << FILENAME << std::endl;
        return false;
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

        items.emplace_back(name, std::stod(unitCost), std::stoi(qty));
    }
    return true;
}

bool serializeItemsToTxtFile()
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
        return false;
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
        default:
            std::cerr << "Invalid input.\n";
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
        default:
            std::cerr << "Invalid input.\n";
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
        case 0:
            return;
        default:
            std::cerr << "Invalid input.\n";
        }
    }
}

void displayAllItem()
{
    enum SortType { BYNAME, BYPRICE, BYQTY };
    SortType type = BYNAME;
    while (true)
    {
        switch (type)
        {
        case BYNAME:
            std::cout << "Sorted by Name\n";
            items.sort([](const Item& a, const Item& b) { return a.getItemName() < b.getItemName(); });
            break;
        case BYQTY:
            std::cout << "Sorted by Quantity\n";
            items.sort([](const Item& a, const Item& b) { return a.getQuantity() < b.getQuantity(); });
            break;
        case BYPRICE:
            std::cout << "Sorted by Price\n";
            items.sort([](const Item& a, const Item& b) { return a.getUnitPrice() < b.getUnitPrice(); });
            break;
        }

        for (const Item& item : items)
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
        case 1: type = BYNAME;
            break;
        case 2: type = BYQTY;
            break;
        case 3: type = BYPRICE;
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
        case 4: items.emplace_back(itemName, unitPrice, quantity);
            serializeItemsToTxtFile();
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
                serializeItemsToTxtFile();
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
                    serializeItemsToTxtFile();
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
            case 1: items.erase(item);
                serializeItemsToTxtFile();
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
        case 0:
            return;
        case 1:
            std::exit(0);
        default:
            std::cerr << "Invalid input.\n";
        }
    }
}

int promptSelection()
{
    std::cout << " Enter your selection: ";
    const int selection = getIntInput();
    return selection;
}

int getIntInput()
{
    int input;
    while (true)
    {
        if (std::cin >> input)
        {
            if (input >= 0) return input;
            std::cout << "Input must be non-negative.\n";
        }
        else
        {
            std::cout << "Invalid input. Please enter a number.\n";
            std::cin.clear(); // clear error state
        }
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); // discard bad input
    }
}

double getDoubleInput()
{
    double input;
    while (true)
    {
        if (std::cin >> input)
        {
            if (input >= 0) return input;
            std::cout << "Input must be non-negative.\n";
        }
        else
        {
            std::cout << "Invalid input. Please enter a number.\n";
            std::cin.clear(); // clear error state
        }
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); // discard bad input
    }
}

std::string getStringInput(const std::string& prompt)
{
    std::string input;
    while (true)
    {
        if (!prompt.empty()) std::cout << prompt;
        if (!(std::cin >> std::ws))
        {
            if (std::cin.eof()) return "";
            std::cin.clear();
            continue;
        }
        std::getline(std::cin, input);
        input.erase(input.find_last_not_of(" \t\n\r") + 1);
        if (!input.empty()) { return input; }
        std::cout << "[!] Input cannot be empty. Please try again.\n";
    }
}
