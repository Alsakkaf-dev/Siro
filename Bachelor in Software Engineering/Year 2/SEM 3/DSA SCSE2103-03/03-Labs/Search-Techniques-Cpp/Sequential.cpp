#include <iostream>
using namespace std;

int Sequential(int searchedValue, int ArrayList[], int sizeArray)
{
    int index = -1; 

    for ( int i = 0; i < sizeArray; i++){
        if(searchedValue == ArrayList[i]){
            index = i;
            break;
        }
    }
    
    return index;
}


int main(){
    int value;
    int ArrayList[]{12,22,45,67,33,11,1};
    int sizeArray = sizeof(ArrayList) / sizeof(ArrayList[0]);

    cout << "please Enter your value: ";
    cin >> value;

    int result = Sequential(value, ArrayList, sizeArray);

    if(result != -1){
        cout << "The location of Value[ " << value << " ] found on location -> " << result;
    } else {
        cout << "Value [ " << value << " ] not found in the array!";
    }
    
    cout << "\n Thank you.....";

    return 0;
}