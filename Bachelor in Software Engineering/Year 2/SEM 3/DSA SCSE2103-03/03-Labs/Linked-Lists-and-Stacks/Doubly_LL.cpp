#include <iostream>
#include <iomanip>
using namespace std;

class StudentNode {
public:
    string name;
    float CPA;
    StudentNode *next;
    StudentNode *prev;
    StudentNode(string n = "", float c = 0) {
        name = n;
        CPA = c;
        next = NULL;
        prev = NULL;
    }
};

class List {
    StudentNode *head;
    StudentNode *tail;
public:
    List() { head = tail = NULL; }
    void task1(StudentNode*);
    void task2(StudentNode*);
    void task3();
    void task4();
    void task5(StudentNode*, int);
    void task6();
};

void List::task1(StudentNode *newNode)
{
    head = newNode;
    tail = newNode;
}

void List::task2(StudentNode *newNode)
{
    if (head == NULL) {
        task1(newNode);
        return;
    }
    tail->next = newNode;
    newNode->prev = tail;
    tail = newNode;
}

void List::task3()
{
    cout << "Print forward:\n";
    StudentNode *temp = head;
    while (temp != NULL)
    {
        cout << "[" << setw(8) << temp->name << " " << temp->CPA << "] -> ";
        temp = temp->next;
    }
    cout << "NULL\n\n";
}

void List::task4()
{
    if (head == NULL) return;
    StudentNode *temp = head;
    head = head->next;
    if (head != NULL)
        head->prev = NULL;
    else
        tail = NULL;
    delete temp;
}

void List::task5(StudentNode *newNode, int n)
{
    if (n == 1) {
        newNode->next = head;
        if (head != NULL) head->prev = newNode;
        head = newNode;
        if (tail == NULL) tail = newNode;
        return;
    }
    StudentNode *temp = head;
    int i = 1;
    while (temp != NULL && i < n - 1) {
        temp = temp->next;
        i++;
    }
    if (temp == NULL) return;
    
    newNode->next = temp->next;
    newNode->prev = temp;
    
    if (temp->next != NULL)
        temp->next->prev = newNode;
    else
        tail = newNode;
        
    temp->next = newNode;
}

void List::task6()
{
    if (tail == NULL) return;
    StudentNode *temp = tail;
    tail = tail->prev;
    if (tail != NULL)
        tail->next = NULL;
    else
        head = NULL;
    delete temp;
}

int main()
{
    List StudList;
    StudentNode *s1 = new StudentNode("Lisa", 3.56);
    StudentNode *s2 = new StudentNode("Shah", 3.75);
    StudentNode *s3 = new StudentNode("Amin", 3.67);
    StudentNode *s4 = new StudentNode("Iman", 3.85);
    StudentNode *s5 = new StudentNode("Afiq", 3.61);

    cout << fixed << setprecision(2) << left;

    StudList.task1(s1);
    StudList.task2(s2);
    StudList.task2(s3);
    StudList.task3();
    StudList.task4();
    StudList.task3();
    StudList.task5(s4, 2);
    StudList.task5(s5, 3);
    StudList.task3();
    StudList.task6();
    StudList.task3();

    return 0;
}