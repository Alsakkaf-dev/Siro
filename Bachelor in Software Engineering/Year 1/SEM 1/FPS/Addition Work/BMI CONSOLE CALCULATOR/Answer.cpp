#include <iostream>
#include <iomanip>

using namespace std;

int main() {
    double weight, height, bmi;

    cout << "Enter your weight (in kg): ";
    cin >> weight;

    cout << "Enter your height (in meters): ";
    cin >> height;

    bmi = weight / (height * height);

    cout << "Your BMI is: " << fixed << setprecision(2) << bmi << endl;

    return 0;
}
