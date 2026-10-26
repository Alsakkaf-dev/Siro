module;
#include <list>
#include <string>

export module utility.Algorithm;

import model.Stock;

export enum SortType
{
    BYNAME,
    BYQTY,
    BYPRICE
};

export class Algorithm
{
public:
    static void sort(std::list<Stock> &arr, const SortType type)
    {
        arr.sort([type](const Stock &a, const Stock &b)
        {
            switch (type)
            {
            case BYNAME:
                return a.getName() < b.getName();
            case BYQTY:
                return a.getQuantity() < b.getQuantity();
            case BYPRICE:
                return a.getUnitCost() < b.getUnitCost();
            default:
                return false;
            }
        });
    }
};