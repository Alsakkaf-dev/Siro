module;
#include <iostream>
#include <string>

export module utility.InputValidator;

export class InputValidator
{
public:
    static int getIntInput()
    {
        int input;
        while (true)
        {
            if (std::cin >> input)
            {
                if (input >= 0) return input;
                std::cout << "Input must be non-negative.\n";
            } else {
                std::cout << "Invalid input. Please enter a number.\n";
                std::cin.clear(); // clear error state
            }
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); // discard bad input
        }
    }

    static double getDoubleInput()
    {
        double input;
        while (true)
        {
            if (std::cin >> input)
            {
                if (input >= 0) return input;
                std::cout << "Input must be non-negative.\n";
            } else {
                std::cout << "Invalid input. Please enter a number.\n";
                std::cin.clear(); // clear error state
            }
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); // discard bad input
        }
    }

    static std::string getStringInput()
    {
        std::string input;
        while (true)
        {
            std::getline(std::cin, input);
            if (!input.empty()) return input;
            std::cout << "Input cannot be empty. Please try again.\n";
        }
    }
};