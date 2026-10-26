#ifndef ALGORITHM_H
#define ALGORITHM_H

#include "Item.h"
#include "List.h"
#include "PriorityQueue.h"

inline List<Item> sort(const List<Item>& items, const PriorityType& sortType)
{
    List<Item> sortedItems;
    PriorityQueue priorityQueue(sortType);
    for (const auto& item : items) { priorityQueue.push(item); }
    for (const auto& elem : priorityQueue) { sortedItems.add(elem); }
    return sortedItems;
}

#endif