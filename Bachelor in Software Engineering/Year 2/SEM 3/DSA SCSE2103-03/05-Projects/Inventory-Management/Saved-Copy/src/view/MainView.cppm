module;
#include <iostream>
#include <string>

export module view.MainView;

import view.AuthView;

export class MainView
{
private:
    AuthView &authView;

public:
    explicit MainView(AuthView &view) : authView(view){}

    void showWelcomeScreen()
    {
        const std::string banner = std::format(
            "\n"
            "\n\t\t=================================================="
            "\n\t\t|                                                |"
            "\n\t\t|          INVENTORY MANAGEMENT SYSTEM           |"
            "\n\t\t|                  Version 1.0                   |"
            "\n\t\t|                                                |"
            "\n\t\t--------------------------------------------------"
            "\n\t\t|                                                |"
            "\n\t\t|                Welcome Group 7                 |"
            "\n\t\t|                                                |"
            "\n\t\t==================================================\n"
            "\n\t\tPress 'Enter' to start the system...");
        std::cout << banner;
        std::cin.get();

        authView.showLoginScreen();
    }
};
