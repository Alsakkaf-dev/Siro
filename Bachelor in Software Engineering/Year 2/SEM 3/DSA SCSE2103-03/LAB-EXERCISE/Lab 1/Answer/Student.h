#ifndef STUDENT_H
#define STUDENT_H

#include <string>
#include <vector>

class Student {
public:
    Student(const std::string& name, double mark); 
    const std::string& getName() const; 
    double getMark() const; 
private:
    std::string name; 
    double mark; 
};

class StudentManager {
public:
    bool loadFromFile(const std::string& filename); 
    void displayAll() const; 
    double calculateAverage() const; 
    bool saveToFile(const std::string& filename) const; 
private:
    std::vector<Student> students; 
};

#endif