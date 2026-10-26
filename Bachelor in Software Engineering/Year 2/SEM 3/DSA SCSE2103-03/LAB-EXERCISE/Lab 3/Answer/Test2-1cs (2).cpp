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
}; 

class DoublyLinkedList {
    private:
        CarSale* head;
        CarSale* tail;

    public:
        DoublyLinkedList()  {
            head=NULL;
            tail=NULL;
        }

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

        // Task 1: 
        void displayForward() {
            CarSale* curr = head;
            while (curr != NULL) {
                curr->printSaleInfo();
                curr = curr->next;
            }
        }

        // Task 2: 
        void displayBackward() {
            CarSale* curr = tail;
            while (curr != NULL) {
                curr->printSaleInfo();
                curr = curr->prev;
            }
        }


         // Task 3:
      void addBetween() {
       CarSale* current = head;
       
          while (current != NULL && current->model != "Saga") {
          current = current->next;
           }

        if (current != NULL) {
        CarSale* newNode = new CarSale("Hilux", "TOYOTA", 11540);
        
        newNode->next = current->next;
        if (current->next != NULL) {
            current->next->prev = newNode;
        }

        current->next = newNode;
        newNode->prev = current;
    }
}

        // Task 4: 
        void deleteLast() {
            if (tail == NULL) return; 

            CarSale* temp = tail;
            tail = tail->prev;
            
            if (tail != NULL) {
                tail->next = NULL;
            } else {
                head = NULL; 
            }

            delete temp; 
        }

        // Task 5:
        void replaceFirst() {
            if (head == NULL) return;
            CarSale* temp = head;

            head = head->next; // Move head forward
            if (head != NULL) {
                head->prev = NULL;
            }

            delete temp; // Destroys "Saga"
            CarSale* newNode = new CarSale("Bezza", "PERODUA", 47100);
    
            newNode->next = head; 
            if (head != NULL) {
                head->prev = newNode; 
            }
            head = newNode; 
        }

        // Task 6:
        void displayAndTotal() {
            int total = 0;
            CarSale* curr = head;

            while (curr != NULL) {
                // 1. Display info
                curr->printSaleInfo();
                total += curr->unitSale;
                CarSale* toDelete = curr;
                curr = curr->next; // Move to next before deleting
                delete toDelete;
            }

            head = NULL;
            tail = NULL;

            cout << "TOTAL SALE\n" << total << " units\n";
        }

}; 


int main() {
    DoublyLinkedList dll;

    
    CarSale *sales[] = { new CarSale("Saga", "PROTON", 6112), 
                        new CarSale("Vios", "TOYOTA", 12513), 
                        new CarSale("City", "HONDA", 12815)
                      };

    int size = sizeof(sales) / sizeof(sales[0]);
    dll.initializeList(sales, size);
 
    // Task 1:
    cout << "\nTask 1: Display Forward:\n";
    dll.displayForward();

    // Task 2:
    cout << "\nTask 2: Display Backward:\n";
    dll.displayBackward();

    // Task 3:
    cout << "\nTask 3: Add 'Hilux' Between 'Saga' and 'Vios':\n";
    dll.addBetween();
    cout << "\nDisplay Forward:\n";
    dll.displayForward();
    cout << "\nDisplay Backward:\n";
    dll.displayBackward();

    // Task 4: 
    cout << "\nTask 4: Delete last node:\n";
    dll.deleteLast();
    cout << "\nDisplay Forward:\n";
    dll.displayForward();
    cout << "\nDisplay Backward:\n";
    dll.displayBackward();

    // Task 5: 
    cout << "\nTask 5: Delete and replace first node with 'Bezza':\n";
    dll.replaceFirst();
    cout << "\nDisplay Forward:\n";
    dll.displayForward();
    cout << "\nDisplay Backward:\n";
    dll.displayBackward();

    // Task 6: 
    cout << "\nTask 6: Display forward, delete and total up unit sales:\n";
    dll.displayAndTotal();

    return 0;
}