'use client'

import React from "react";
import { useState, useEffect, useMemo, useReducer, useRef, useCallback, memo } from "react";

import {
  Column,
  Table,
  useReactTable,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  sortingFns,
  getSortedRowModel,
  FilterFn,
  SortingFn,
  ColumnDef,
  flexRender,
  FilterFns,
  createColumnHelper
} from '@tanstack/react-table'

import {
  RankingInfo,
  rankItem,
  compareItems,
} from '@tanstack/match-sorter-utils'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

function useSkipper() {
  const shouldSkipRef = useRef(true)
  const shouldSkip = shouldSkipRef.current

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = useCallback(() => {
    shouldSkipRef.current = false
  }, [])

  useEffect(() => {
    shouldSkipRef.current = true
  })

  return [shouldSkip, skip]
}

function Filter({ column, table }) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id)

  const columnFilterValue = column.getFilterValue()

  const sortedUniqueValues = useMemo(
    () =>
      typeof firstValue === "number"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  )

  if (typeof firstValue === "object"){

    let uniqueValuesArrays = Array.from(column.getFacetedUniqueValues().keys())
    let uniqueValues = [...new Set(uniqueValuesArrays.flat(1))];

    if (column.id == "text"){
      uniqueValuesArrays = Array.from(column.getFacetedUniqueValues().keys())	
      const values = table.getCoreRowModel().flatRows.map(row => {
        let val = row.getValue(column.id)
        let text_content_obj = val.find(({content_type}) => content_type === "text")
        return text_content_obj['content_value']['text']
      })
      uniqueValues= Array.from(new Set(values));
      uniqueValues = uniqueValues.filter(e => e !== undefined)
      uniqueValues = uniqueValues.sort((a, b) => a.length - b.length);
    }

    if (column.id.includes("_textLabel")){
      uniqueValuesArrays = Array.from(column.getFacetedUniqueValues().keys())	
      const values = table.getCoreRowModel().flatRows.map(row => row.getValue(column.id)['text'])
      uniqueValues= Array.from(new Set(values));
      uniqueValues = uniqueValues.filter(e => e !== undefined)
      if ((uniqueValues.length>0) && (uniqueValues[0].length==1)){
        uniqueValues = ["",'1','2','3','4','5']
      } else {
        uniqueValues= ["",'positive','negative']
      }
    }

    if (column.id.includes("_textLabelRationale")){
      uniqueValuesArrays = Array.from(column.getFacetedUniqueValues().keys())	
      const values = table.getCoreRowModel().flatRows.map(row => row.getValue(column.id)['rationale'])
      uniqueValues= Array.from(new Set(values));
      uniqueValues = uniqueValues.filter(e => e !== undefined)
      uniqueValues = uniqueValues.sort((a, b) => a.length - b.length);
    }

    if (column.id == "example"){
      uniqueValuesArrays = Array.from(column.getFacetedUniqueValues().keys())	
      const values = table.getCoreRowModel().flatRows.map(row => example_val_to_label(row.getValue(column.id)[0]['value']))
      uniqueValues= Array.from(new Set(values));
      uniqueValues = uniqueValues.filter(e => e !== undefined)
      uniqueValues = uniqueValues.sort((a, b) => a.length - b.length);
    }

    return (    <>
      <datalist id={column.id + "list"}>
        {uniqueValues.map((value, index) => {
          if (value == ""){
            return (<option value={"<Blank>"} key={value + "_" + index} />)
          }else{
            return (<option value={value} key={value + "_" + index} />)
          }
        })}
      </datalist>
      <DebouncedInput
        type="text"
        value={columnFilterValue ?? ""}
        onChange={value => column.setFilterValue(value)}
        placeholder={`Search... (${uniqueValues.length})`}
        className="w-36 border rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>)
  } else {
    if (column.id.includes("_textPredictionsResult") || (column.id == "_textPredictions")) {
      let uniqueValues=[]
      if (column.id.includes("_textPredictionsResult")){
        uniqueValues= ["",'✔','✘']
      }
      if (column.id == "_textPredictions"){
        let uniqueValuesArrays = Array.from(column.getFacetedUniqueValues().keys())	
        const values = table.getCoreRowModel().flatRows.map(row => (row.getValue(column.id)))
        uniqueValues= Array.from(new Set(values));
        uniqueValues = uniqueValues.filter(e => e !== undefined)
        if ((uniqueValues.length>0) && (uniqueValues[0].length==1)){
          uniqueValues = ["",'1','2','3','4','5',"content_filter"]
        } else {
          uniqueValues= ["",'positive','negative',"content_filter"]
        }
      }
      return (    <>
        <datalist id={column.id + "list"}>
          {uniqueValues.map((value, index) => {
            if (value == ""){
              return (<option value={"<Blank>"} key={value + "_" + index} />)
            }else{
              return (<option value={value} key={value + "_" + index} />)
            }
          })}
        </datalist>
        <DebouncedInput
          type="text"
          value={columnFilterValue ?? ""}
          onChange={value => column.setFilterValue(value)}
          placeholder={`Search... (${uniqueValues.length})`}
          className="w-36 border rounded"
          list={column.id + "list"}
        />
        <div className="h-1" />
      </>)
    }
  }

  return typeof firstValue === "number" ? (
    <div>
      <div className="flex flex-wrap space-x-2">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={columnFilterValue?.[0] ?? ""}
          onChange={value => column.setFilterValue(old => [value, old?.[1]])}
          placeholder={'Min'}
          className="w-24 border rounded"
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={columnFilterValue?.[1] ?? ""}
          onChange={value => column.setFilterValue(old => [old?.[0], value])}
          placeholder={'Max'}
          className="w-24 border rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : (
    <>
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.slice(0, 5000).map((value, index) => (
          <option value={value} key={value + "_" + index} />
        ))}
      </datalist>
      <DebouncedInput
        type="text"
        value={columnFilterValue ?? ""}
        onChange={value => column.setFilterValue(value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        className="w-36 border rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>
  )
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <input {...props} value={value} onChange={e => setValue(e.target.value)} />
  )
}


const DynamicList = ({
  name,
  combinedData,
  columns,
  sorting,
  onSorting,
  columnVisibility,
  robot_cols,
  showRobotItems,
  expand_mode=""
}) => {

  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

  if (typeof(combinedData) !== 'undefined'){

    const table = useReactTable({
      data:combinedData,
      columns,
      filterFns: {
        fuzzy: fuzzyFilter
      },
      state: {
        columnVisibility,
        columnFilters,
        sorting,
        pagination,
      },
      onColumnFiltersChange: setColumnFilters,
      onSortingChange: (input)=>{
        onSorting(input)
      },
      enableMultiSorting: true,
      globalFilterFn: fuzzyFilter,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      onPaginationChange: setPagination, //update the pagination state when internal APIs mutate the pagination state
      autoResetPageIndex: false, // turn off page index reset when sorting or filtering
      // Provide our updateData function to our table meta
      meta: {
        updateData: (rowIndex, columnId, value) => {
          // Skip page index reset until after next rerender
          skipAutoResetPageIndex()
          setData(old =>
            old.map((row, index) => {
              if (index === rowIndex) {
                return {
                  ...old[rowIndex],
                  [columnId]: value
                }
              }
              return row
            })
          )
        }
      },
      defaultColumn: {
        maxSize:200
      }
    })

    return (
      <div className="">
        <div className={"item-list-view-count " + expand_mode}><i>Viewing {table.getPrePaginationRowModel().rows.length} items from the dataset "{name}"</i></div>
        <div className="h-2" />
        <table>
          <thead className={expand_mode}>
            <tr>
            {table.getHeaderGroups().map((headerGroup, index) => {
                return (
                  <>
                  {headerGroup.headers.map((header, index2) => {
                    return (
                      <th>
                        {showRobotItems && robot_cols.includes(header.id) ? 
                          <>
                            <span className="material-symbols-outlined robot-icon">smart_toy</span><br/>
                          </> 
                          :
                          <></>
                        }
                      </th>
                    )
                  })}
                  </>
                )
              })}
            </tr>
            <tr>
              {table.getHeaderGroups().map((headerGroup, index) => {
                return (
                  <>
                  {headerGroup.headers.map((header, index2) => {
                    return (
                      <th>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    )
                  })}
                  </>
                )
              })}
            </tr>
            <tr>
            {table.getHeaderGroups().map((headerGroup, index) => {
                return (
                  <>
                  {headerGroup.headers.map((header, index2) => {
                    return (
                      <th>
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "click-to-sort cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler()
                          }}
                        ></div>
                        {header.column.getCanSort() ? (
                          {
                            asc: <div><span className="opacity-05">🔼</span>🔽</div>,
                            desc: <div>🔼<span className="opacity-05">🔽</span></div>
                          }[header.column.getIsSorted()] ?? <div className="opacity-05">🔼🔽</div>
                        ) : null}
                      </th>
                    )
                  })}
                  </>
                )
              })}
            </tr>
            <tr>
            {table.getHeaderGroups().map((headerGroup, index) => {
                return (
                  <>
                  {headerGroup.headers.map((header, index2) => {
                    return (
                      <th>
                        <div>
                          {header.column.getCanFilter() ? (
                            <div>
                              <Filter column={header.column} table={table} />
                            </div>
                          ) : null}
                        </div>
                      </th>
                    )
                  })}
                  </>
                )
              })}
            </tr>

          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              return (
                <tr className="data-table-row" key={row.id}>
                  {row.getVisibleCells().map(cell => {
                    return (
                      <td key={cell.id} className={cell.id=="example" ? "example" : ""}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="h-2" />
        <div className="table-controls flex items-center gap-2">
          <button
            type="button"
            className="border rounded p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            type="button"
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            type="button"
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            type="button"
            className="border rounded p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
             | Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    )

  } else {
    return <></>
  }
  
}
  
export default DynamicList