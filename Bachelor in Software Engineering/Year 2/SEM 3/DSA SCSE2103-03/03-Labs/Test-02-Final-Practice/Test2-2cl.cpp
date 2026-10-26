// Test 2 - SECJ2013 - 24251 (Test2-2cl.cpp)
// Name: ???
// Matric No.: ???
// Section: ???

#include <iostream>
#include <string>

using namespace std;

const int STACK_SIZE = 5;

class Cylinder
{
private:
    string ID;
    int radius, height;

public:
    Cylinder() {}

    Cylinder(string id, int r, int h)
    {
        ID = id;
        radius = r;
        height = h;
    }

    string getID()
    {
        return ID;
    }

    int volume()
    {
        return 3.14 * radius * radius * height;
    }

    void printCylinderInfo()
    {
        cout << ID << ", " << volume() << "\n";
    }
};

class Stack
{
public:
    int top;
    Cylinder data[STACK_SIZE];

    // Task 1: Complete the createStack() function
    void createStack()
    {
        top = -1;
    }

    // Task 2: Complete the push() function
    void push(Cylinder cl)
    {
        if (isFull())
        {
            cout << "Can't push Cylinder CL4350, stack is full!";
        }
        else
        {
            top = top + 1;
            cout << "Push Cylinder " << cl.getID() << " stack.";
            data[top] = cl;
        }
    }

    // Task 3: Complete the pop() function
    void pop()
    {
        if (isEmpty())
        {
            cout << "Can't pop Cylinder from stack, stack is empty!";
        }
        else
        {
            cout << "Pop Cylinder " << data[top].getID() << " from stack";
            top = top - 1;
        }
    }

    // Task 4: Modify the stackTop(), isEmpty(), and isFull() functions
    Cylinder stackTop()
    {
        if (isEmpty())
        {
            cout << "\nstack is empty!!";
            return Cylinder();
        }
        else
        {
            return data[top];
        }
    }

    bool isEmpty()
    {
        if (top == -1)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    bool isFull()
    {
        if (top == STACK_SIZE - 1)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    void checkContent()
    {
        cout << "Current stack content:\n";

        if (!isEmpty())
        {
            for (int i = top; i > -1; i--)
            {
                if (i == top)
                {
                    cout << "Top -> ";
                }
                else
                {
                    cout << "       ";
                }

                data[i].printCylinderInfo();
            }
        }
    }
};

// main function
int main()
{
    Cylinder cylinders[6] = {
        Cylinder("CL3215", 60, 20),
        Cylinder("CL9253", 15, 42),
        Cylinder("CL4399", 15, 12),
        Cylinder("CL3200", 19, 18),
        Cylinder("CL8480", 75, 30),
        Cylinder("CL4350", 12, 35),
    };

    Stack cylinderStack;
    cylinderStack.createStack();

    cout << "Try to push all cylinders onto the stack:\n";
    for (int i = 0; i < 6; i++)
    {
        cylinderStack.push(cylinders[i]);
    }
    cout << "\n";

    cout << "Cylinder at top => ";
    cylinderStack.stackTop().printCylinderInfo();
    cout << "\n";

    cylinderStack.checkContent();
    cout << "\n\n";

    cout << "Pop stack until Cylinder 'CL4399' becomes the top and \n";
    cout << "then push Cylinder 'CL4350' onto the stack... \n";

    // Task 5:
    // pop cylinder objects using 'while' loop until
    // Cylinder 'CL4399' becomes the top
    // ???
    // ???
    // ???

    // push Cylinder 'CL4350' onto stack
    // ???

    cylinderStack.checkContent();
    cout << "\n";

    cout << "Pop all cylinders from stack:\n";
    while (!cylinderStack.isEmpty())
    {
        cylinderStack.pop();
    }
    cout << "\n";

    cout << "Try to pop Cylinder even stack is empty:\n";
    cylinderStack.pop();

    return 0;
}