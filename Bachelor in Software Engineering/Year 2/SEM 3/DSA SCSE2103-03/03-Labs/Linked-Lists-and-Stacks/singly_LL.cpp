#include <iostream>
#include <iomanip>
using namespace std;

class StudentNode {
public:
    string name;
    float CPA;
    StudentNode *next;
    StudentNode(string n = "", float c = 0) {
        name = n;
        CPA = c;
        next = NULL;
    }
};

class List {
    StudentNode *head;
public:
    List() { head = NULL; }
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
}

void List::task2(StudentNode *newNode)
{
    if (head == NULL) {
        head = newNode;
        return;
    }
    StudentNode *temp = head;
    while (temp->next != NULL)
        temp = temp->next;
    temp->next = newNode;
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
    delete temp;
}

void List::task5(StudentNode *newNode, int n)
{
    if (n == 1) {
        newNode->next = head;
        head = newNode;
        return;
    }
    StudentNode *temp = head;
    int i = 1;
    while (i < n - 1 && temp != NULL)
    {
        temp = temp->next;
        i++;
    }
    if (temp == NULL) return;
    newNode->next = temp->next;
    temp->next = newNode;
}

void List::task6()
{
    if (head == NULL) return;
    if (head->next == NULL) {
        delete head;
        head = NULL;
        return;
    }
    StudentNode *temp = head;
    while (temp->next->next != NULL)
    {
        temp = temp->next;
    }
    delete temp->next;
    temp->next = NULL;
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