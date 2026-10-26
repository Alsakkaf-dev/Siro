module;
#include <array>
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
private:
    static void sort(std::array<Stock,10> &arr, const int j, const SortType type)
    {
        switch (type)
        {
        case BYNAME:
            if (arr[j].getName() > arr[j + 1].getName())
                std::swap(arr[j], arr[j + 1]);
            break;

        case BYQTY:
            if (arr[j].getQuantity() > arr[j + 1].getQuantity())
                std::swap(arr[j], arr[j + 1]);
            break;

        case BYPRICE:
            if (arr[j].getUnitCost() > arr[j + 1].getUnitCost())
                std::swap(arr[j], arr[j + 1]);
            break;
        }
    }

public:
    static void bubbleSort(std::array<Stock,10> &arr, const SortType type)
    {
        const int n = arr.size();
        for (int i = 0; i < n - 1; i++)
        {
            for (int j = 0; j < n - i - 1; j++)
            {
                sort(arr, j, type);
            }
        }
    }
};