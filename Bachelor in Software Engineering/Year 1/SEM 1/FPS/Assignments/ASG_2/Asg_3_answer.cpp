#include <iostream>
#include <iomanip> 
#include <string>

using namespace std;

const int MAX_PRODUCTS = 100; 

struct Product {
    string name;
    float unit_price;
    int quantity;
    float total_price;
};

float calculate_total_price(float unit_price, int quantity) {
    float discount = 0.0;

    if (quantity > 10) {
        discount = 0.10; 
    } else if (quantity >= 5 && quantity <= 10) {
        discount = 0.05; 
    }

    return (unit_price * quantity) * (1 - discount);
}

void display_final_bill(Product products[], int product_count) {
    float grand_total = 0.0;

    cout << "\nFinal Bill:\n";
    cout << "--------------------------------------\n";
    cout << left << setw(15) << "Product" << setw(10) << "Price" << setw(10) << "Quantity" << setw(10) << "Total" << endl;
    cout << "--------------------------------------\n";

    for (int i = 0; i < product_count; ++i) {
        cout << left << setw(15) << products[i].name << setw(10) << products[i].unit_price
             << setw(10) << products[i].quantity << setw(10) << products[i].total_price << endl;
        grand_total += products[i].total_price;
    }

    cout << "--------------------------------------\n";
    cout << "Grand Total: $" << grand_total << endl;
}

int main() {
    Product products[MAX_PRODUCTS];
    int product_count = 0;
    int option;

    do {
        cout << "\n1. Add Product to Bill\n";
        cout << "2. Display Final Bill and Exit\n";
        cout << "Enter your option: ";
        cin >> option;

        if (option == 1) {
            if (product_count < MAX_PRODUCTS) {
                cout << "Enter Product Name: ";
                cin >> products[product_count].name;
                cout << "Enter Unit Price: ";
                cin >> products[product_count].unit_price;
                cout << "Enter Quantity Purchased: ";
                cin >> products[product_count].quantity;

              
                products[product_count].total_price = calculate_total_price(products[product_count].unit_price, products[product_count].quantity);

                product_count++; 
            } else {
                cout << "Cannot add more products, the limit is reached.\n";
            }
        } else if (option == 2) {
            
            display_final_bill(products, product_count);
        } else {
            cout << "Invalid option. Please try again.\n";
        }

    } while (option != 2); 

    return 0;
}
