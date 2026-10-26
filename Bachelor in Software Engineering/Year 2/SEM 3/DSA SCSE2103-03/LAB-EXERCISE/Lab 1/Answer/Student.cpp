#include "Student.h"
#include <iostream>   
#include <fstream>    
#include <sstream>    
#include <iomanip>    
#include <string>
#include <vector>

using namespace std;




Student::Student(const std::string& name, double mark) {
    this->name = name;
    this->mark = mark;
}


const std::string& Student::getName() const {
    return name;
}


double Student::getMark() const {
    return mark;
}



 
bool StudentManager::loadFromFile(const std::string& filename) {
    ifstream file(filename); 
    
    
    if (!file.is_open()) {
        return false;
    }

    string line;
    string studentName;
    double studentMark;

    
    while (getline(file, line)) {
        stringstream ss(line); 
        
        
        if (ss >> studentName >> studentMark) {
            
            students.push_back(Student(studentName, studentMark));
        }
    }

    file.close(); 
    return true; 
}


void StudentManager::displayAll() const {
    
    cout << "\n" << left << setw(15) << "Student Name" << "Mark" << endl;
    cout << "---------------------" << endl;

    
    for (const auto& student : students) {
        cout << left << setw(15) << student.getName() << student.getMark() << endl;
    }
}


double StudentManager::calculateAverage() const {
    
    if (students.empty()) {
        return 0.0;
    }

    double total = 0.0;
    
    for (const auto& student : students) {
        total += student.getMark();
    }

    
    return total / students.size();
}


bool StudentManager::saveToFile(const std::string& filename) const {
    ofstream file(filename); 

    
    if (!file.is_open()) {
        return false;
    }

    
    file << left << setw(15) << "Student Name" << "Mark" << endl;
    file << "---------------------" << endl;

    
    for (const auto& student : students) {
        file << left << setw(15) << student.getName() << student.getMark() << endl;
    }

    
    double avg = calculateAverage();
    file << "\nAverage mark: " << avg << endl;

    file.close(); 
    return true; 
}