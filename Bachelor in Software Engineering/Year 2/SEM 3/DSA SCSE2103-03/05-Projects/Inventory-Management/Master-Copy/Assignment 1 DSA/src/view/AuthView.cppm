module;
#include <iostream>
#include <string>
#include <cstdlib>

export module view.AuthView;

import model.User;
import view.AdminView;
import view.InventoryView;
import controller.AuthController;
import utility.InputValidator;

export class AuthView
{
private:
    AdminView &adminView;
    InventoryView &invView;
    AuthController &authController;

    std::string promptUsername()
    {
        std::cout << "\t\t Enter your username: ";
        std::string username = InputValidator::getStringInput();
        return username;
    }

    std::string promptPassword()
    {
        std::cout << "\t\t Enter password: ";
        std::string password = InputValidator::getStringInput();
        return password;
    }

    void displayInvalidCredentials()
    {
        std::cerr << "\n\t\t [!] Invalid username or password.\n";
    }

public:
    AuthView(AdminView &adminView, InventoryView &invView, AuthController &controller)
        : adminView(adminView), invView(invView), authController(controller) {}

    [[noreturn]] void showLoginScreen()
    {
        while (true)
        {
            switch (authController.authenticate(promptPassword(), promptUsername()))
            {
            case 0:
                adminView.showMenu();
            case 1:
                invView.showMenu();
            default:
                displayInvalidCredentials();
            }
        }
    }
};
