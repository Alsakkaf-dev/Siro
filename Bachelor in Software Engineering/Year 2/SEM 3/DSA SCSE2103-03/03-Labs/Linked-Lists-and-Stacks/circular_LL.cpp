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
    head = tail = newNode;
    newNode->next = head;
}

void List::task2(StudentNode *newNode)
{
    if (head == NULL) {
        task1(newNode);
        return;
    }
    tail->next = newNode;
    newNode->next = head;
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
    head = head->next;
    tail->next = head;
    delete temp;
}

void List::task5(StudentNode *newNode, int n)
{
    if (n == 1) {
        if(head == NULL) {
            task1(newNode);
        } else {
            newNode->next = head;
            head = newNode;
            tail->next = head;
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
    StudentNode *temp = head;
    while (temp->next != tail) {
        temp = temp->next;
    }
    StudentNode *del = tail;
    tail = temp;
    tail->next = head;
    delete del;
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