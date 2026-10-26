#include "Student.h"
#include <iostream>

using namespace std;

int main()
{
    StudentManager manager;

    if (manager.loadFromFile("students.txt"))
    {
        cout << "File loaded successfully!\n";
    }
    else
    {
        cout << "Error: Unable to open input file.\n";
        return 1;
    }

    manager.displayAll();

    cout << "\nAverage mark: " << manager.calculateAverage() << endl;

    if (manager.saveToFile("results.txt"))
    {
        cout << "Results saved to file successfully!\n";
    }
    else
    {
        cout << "Error: Unable to save file.\n";
    }

    return 0;
}