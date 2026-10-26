#ifndef INPUTVALIDATOR_H
#define INPUTVALIDATOR_H

#include <iostream>
#include <string>
#include <limits>

inline int getIntInput()
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

inline double getDoubleInput()
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

inline std::string getStringInput(const std::string& prompt = "")
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
        if(!input.empty())
        {
             // Simple trim for trailing whitespace if needed, 
             // but strictly following logic from original:
             size_t last = input.find_last_not_of(" \t\n\r");
             if (last != std::string::npos)
                input.erase(last + 1);
        }
        
        if (!input.empty()) { return input; }
        std::cout << "[!] Input cannot be empty. Please try again.\n";
    }
}

#endif