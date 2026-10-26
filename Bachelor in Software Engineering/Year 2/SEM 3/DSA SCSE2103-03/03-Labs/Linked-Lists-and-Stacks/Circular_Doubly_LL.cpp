#include <iostream>
#include <iomanip>
using namespace std;

class StudentNode {
public:
    string name;
    float CPA;
    StudentNode *next, *prev;
    StudentNode(string n = "", float c = 0) {
        name = n;
        CPA = c;
        next = NULL;
        prev = NULL;
    }
};

class List {
    StudentNode *head, *tail;
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
    head->next = head;
    head->prev = head;
}

void List::task2(StudentNode *newNode)
{
    if (head == NULL) {
        task1(newNode);
        return;
    }
    tail->next = newNode;
    newNode->prev = tail;
    newNode->next = head;
    head->prev = newNode;
    tail = newNode;
}

void List::task3()
{
    if (head == NULL) return;
    cout << "Print forward:\n";
    StudentNode *temp = head;
    do {
        cout << "[" << setw(8) << temp->name << " " << temp->CPA << "] -> ";
        temp = temp->next;
    } while (temp != head);
    cout << "(HEAD)\n\n";
}

void List::task4()
{
    if (head == NULL) return;
    
    if (head == tail) {
        delete head;
        head = tail = NULL;
        return;
    }

    StudentNode *temp = head;
    tail->next = head->next;
    head = head->next;
    head->prev = tail;
    delete temp;
}

void List::task5(StudentNode *newNode, int n)
{
    if (n == 1 || head == NULL) {
        if (head == NULL) {
            task1(newNode);
        } else {
            newNode->next = head;
            newNode->prev = tail;
            head->prev = newNode;
            tail->next = newNode;
            head = newNode;
        }
        return;
    }

    StudentNode *temp = head;
    int i = 1;
    while (i < n - 1 && temp->next != head) {
        temp = temp->next;
        i++;
    }

    newNode->next = temp->next;
    newNode->prev = temp;
    temp->next->prev = newNode;
    temp->next = newNode;

    if (temp == tail)
        tail = newNode;
}

void List::task6()
{
    if (head == NULL) return;

    if (head == tail) {
        delete head;
        head = tail = NULL;
        return;
    }

    StudentNode *temp = tail;
    tail = tail->prev;
    tail->next = head;
    head->prev = tail;
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