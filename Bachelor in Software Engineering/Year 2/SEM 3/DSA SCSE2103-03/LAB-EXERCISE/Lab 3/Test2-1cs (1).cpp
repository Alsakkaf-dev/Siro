// Test 2 - SECJ2013 - 24251 (Test2-1cs.cpp)
// Name: ???
// Matric No.: ???
// Section: ???

#include <iostream>
#include <string>
using namespace std;

class CarSale {
    public:
        string model;
        string brand;
        int unitSale;

        CarSale* next;
        CarSale* prev;
 
        CarSale(string m, string b, int us) {
            model = m;
            brand = b;
            unitSale = us;
            next=NULL;
            prev=NULL;	
	    }

        void printSaleInfo() {
            cout << model << " (" << brand << ")" << " - " << unitSale << " units\n";
        }

        ~CarSale() {
            cout << "Destroy CarSale: " << model << "\n";
        }
}; // end of CarSale class

class DoublyLinkedList {
    private:
        CarSale* head;
        CarSale* tail;

    public:
        DoublyLinkedList()  {
            head=NULL;
            tail=NULL;
        }


        // Function to initialize the list from an array
        void initializeList(CarSale *sales[], int size) {
            for (int i = 0; i < size; ++i) {
                CarSale* stf = sales[i];
                cout << "Add " << stf->model << " to the list...\n";
                
                if (!head) {
                    head = tail = stf;

                } else {
                    tail->next = stf;
                    stf->prev = tail;
                    tail = stf;
                }
            }
        }

        // Task 1: Display the list in forward order
        void displayForward() {

        }

        // Task 2: Display the list in backward order
        void displayBackward() {

        }

        // Task 3: Add car sale "Hilux" between "Saga" and "Vios"
        void addBetween() {

        }

        // Task 4: Delete the last node from the list
        void deleteLast() {

        }

        // Task 5: Delete and replace first node with "Bezza"
        void replaceFirst() {

        }

        // Task 6: Display forward, delete and total up unit sales
        void displayAndTotal() {
        
        }

}; // end of DoublyLinkedList class

// main function to test and store CarSale objects in 
// doubly linked list form by using DoublyLinked class
int main() {
    DoublyLinkedList dll;

    // Initialize the list with the given car sale information list
    CarSale *sales[] = { new CarSale("Saga", "PROTON", 6112), 
                        new CarSale("Vios", "TOYOTA", 12513), 
                        new CarSale("City", "HONDA", 12815)
                      };

    int size = sizeof(sales) / sizeof(sales[0]);
    dll.initializeList(sales, size);
 
    // Task 1: Display forward
    cout << "\nTask 1: Display Forward:\n";
    dll.displayForward();

    // Task 2: Display backward
    cout << "\nTask 2: Display Backward:\n";
    dll.displayBackward();

    // Task 3: Add 'Hilux' between 'Saga' and 'Vios'
    cout << "\nTask 3: Add 'Hilux' Between 'Saga' and 'Vios':\n";
    dll.addBetween();
    cout << "\nDisplay Forward:\n";
    dll.displayForward();
    cout << "\nDisplay Backward:\n";
    dll.displayBackward();

    // Task 4: Delete the last node
    cout << "\nTask 4: Delete last node:\n";
    dll.deleteLast();
    cout << "\nDisplay Forward:\n";
    dll.displayForward();
    cout << "\nDisplay Backward:\n";
    dll.displayBackward();

    // Task 5: Delete and replace first node with 'Bezza'
    cout << "\nTask 5: Delete and replace first node with 'Bezza':\n";
    dll.replaceFirst();
    cout << "\nDisplay Forward:\n";
    dll.displayForward();
    cout << "\nDisplay Backward:\n";
    dll.displayBackward();

    // Task 6: Display forward, delete and total up unit sale
    cout << "\nTask 6: Display forward, delete and total up unit sales:\n";
    dll.displayAndTotal();

    return 0;
}

