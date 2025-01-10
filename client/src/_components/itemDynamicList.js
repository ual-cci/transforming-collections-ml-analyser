'use client'

import React from "react";
import { useState, useEffect, useMemo, useReducer, useRef, useCallbac, memo } from "react";
import ItemCheckboxSet from "./itemCheckboxSet";
import ItemPredictions from "./itemPredictions";
import Item from "./item";
import ItemTextInput from "./itemTextInput";
import ItemScoreSelector from "./itemScoreSelector";
import { mergeArrays, binary_val_to_label, example_val_to_label, useEffectDebugger } from "@/_helpers/utills";
import TextHighlighter from "./textHighlighter";

import {
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import {
  rankItem,
} from '@tanstack/match-sorter-utils'
import DynamicList from "./dynamicList";
import ItemImageLoader from "./itemImageLoader";

const columnHelper = createColumnHelper()

const ItemDynamicList = ({
    labelset_id,
    labelset_type,
    dataset={"artworks":[],"name":"", "type":""},
    labelset={"_id":"","labels":[]},
    examples=[],
    predictions=[],
    sample_ids=[],
    enableLabelling=true,
    enableExampleSelection=false,
    enableSampleSelection=false,
    showLabels=true,
    showPredictions=true,
    showExamples=false,
    showSample=false,
    showGrade=false,
    showRobotItems=true,
    onLabelsChanged=(e)=>{},
    onExamplesChanged=(e)=>{},
    onSampleChanged=(e)=>{},
    analyser_id=null,
    expand_mode="",
    useTab,
    model_source=""
}) => {

  const [columnVisibility, setColumnVisibility] = useState({
    'example':false,
    'example_select':false,
    'sample':false,
    'sample_select':false,
    'position':false,
    'object_id':false,
    'image': false,
    'text': false,
    '_textLabel':false,
    '_textLabelScore': false,
    '_textLabelPositive': false,
    '_textLabelNegative': false,
    '_textLabelRationale_edit': false,
    '_textLabelRationale': false,
    '_textPredictions':false,
    '_textPredictionsResult':false,
    "_textLabelExclude": false
  })

  const createCombinedData = (dataset,labelset,examples,predictions,sample_ids) => {
    let newdata = dataset.artworks.map((item,index) => {
      let newItem = {...item}
      if ((labelset!=undefined) && ("labels" in labelset) && (labelset.labels.length > 0)){
        let label_result = labelset.labels.find(label => {
          return label['item_id'] == item["_id"]
        })
        if (label_result != undefined){
          newItem['_textLabel'] = label_result
        } else {
          newItem['_textLabel'] = {}
        }
      } else {
        newItem['_textLabel'] = {}
      } 
      if (examples!=null && examples.length > 0){
        if (examples.includes(item['_id'])){
          newItem['_example'] = [{"value":1}]
        } else {
          newItem['_example'] = [{"value":0}]
        }
      } else {
        newItem['_example'] = [{"value":0}]
      }
      if (sample_ids!=null && sample_ids.length > 0){
        if (sample_ids.includes(item['_id'])){
          newItem['_sample'] = [{"value":1}]
        } else {
          newItem['_sample'] = [{"value":0}]
        }
      } else {
        newItem['_sample'] = [{"value":0}]
      }
      if (predictions!=null && predictions.length>0){
        let pred_result = predictions.find(pred => {
          return Object.keys(pred)[0] == item["_id"]
        })
        if (pred_result != undefined){
          newItem['_textPredictions'] = pred_result[item["_id"]]
        }
      } else {
        newItem['_textPredictions'] = ""
      }
      return newItem
    })
    return newdata
  }


  const [sorting, setSorting] = useState([])
  const combinedData = useMemo(() => createCombinedData(dataset,labelset,examples,predictions, sample_ids), [dataset,labelset,examples,predictions,labelset_type, sample_ids])

  const robot_cols = [
    'example',
    'example_select',
    'sample',
    'sample_select',
    '_textLabel',
    '_textLabelRationale_edit',
    '_textLabelRationale',
    '_textLabelPositive',
    '_textLabelNegative',
    '_textLabelScore',
    '_textPredictionsResult'
  ]

  const updateRationale = (ref_id,obj_id,rationale) => {

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    try {
      return fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/update_label?" + new URLSearchParams({
        "labelset_id":ref_id,
        "id": obj_id,// string containing item_id
        "rationale":rationale.length>0 ? rationale : "<Empty>"
      }),requestOptions)
      .then(response => response.json())
      .then(
        res => {
          console.log(res)
          onLabelsChanged()
        }
      )
    } catch (e){
      console.log("ERROR")
      console.log(e)
    }

  }

  const onItemHighlight = (ref_id,obj_id,highlight) => {

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    try {
      return fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/update_label?" + new URLSearchParams({
        "labelset_id":ref_id,
        "id": obj_id,// string containing item_id
        "highlight":JSON.stringify(highlight)
      }),requestOptions)
      .then(response => response.json())
      .then(
        res => {
          console.log(res)
          onLabelsChanged()
        }
      )
    } catch (e){
      console.log("ERROR")
      console.log(e)
    }

  }

  const handleRationale = (ref_id,obj_id,rationale) => {
    updateRationale(ref_id,obj_id,rationale)
  }

  useEffect(() => {

    if (predictions!=null && predictions.length>0 && columnVisibility['_textPredictions'] && !enableLabelling && !enableExampleSelection && !enableSampleSelection){
      setSorting([
        {
          id:"_textPredictions",
          desc:false
        }
      ])
    }

  }, [dataset,labelset,examples,predictions,sample_ids,columnVisibility])

  useEffect(() => {
    setColumnVisibility({
      'object_id': dataset.artworks.some(e => e.object_id != null),
      'example':showExamples,
      'example_select':enableExampleSelection && (labelset._id != ""),
      'sample':showSample && !enableSampleSelection,
      'sample_select':enableSampleSelection,
      'image': dataset['type']!=null && dataset['type'].includes("image"),
      'text': dataset['type']!=null && dataset['type'].includes("text"),
      '_textLabel':showLabels && !enableLabelling && (labelset.labels.length > 0),
      '_textLabelPositive': enableLabelling && (labelset_type === 'binary') && (labelset._id != ""),
      '_textLabelNegative': enableLabelling && (labelset_type === 'binary') && (labelset._id != ""),
      '_textLabelScore': enableLabelling && (labelset_type === 'score') && (labelset._id != ""),
      '_textLabelRationale_edit': showLabels && enableLabelling && (labelset._id != ""),
      '_textLabelRationale': false,
      '_textPredictions':showPredictions && predictions.length > 0,
      '_textPredictionsResult':showPredictions && showGrade && predictions.length > 0,
      "_textLabelExclude": false
    })

  },[enableLabelling,showLabels,showPredictions,showExamples,showSample,enableExampleSelection,enableSampleSelection,labelset_type,labelset,dataset,predictions])

  const filterWithBlanks = (row, columnId, value, addMeta) => {
    
    let pred = ""
    if (row.getValue(columnId) != null && row.getValue(columnId) != ""){
      pred = row.getValue(columnId)
    } else {
      pred = "<Blank>"
    }

    let val = (value.length == 0) ? "<Blank>" : value

    // Rank the item
    const itemRank = rankItem(pred, val)
  
    // Store the itemRank info
    addMeta({
      itemRank,
    })
  
    // Return if the item should be filtered in/out
    return itemRank.passed
  }

  const labelFilter = (row, columnId, value, addMeta) => {

    let val = ""

    if ((row.getValue(columnId) != null) && 
        ('value' in row.getValue(columnId))
    ){
      if (labelset.label_type == "binary"){
        val = binary_val_to_label(row.getValue(columnId)['value']) != "" ? binary_val_to_label(row.getValue(columnId)['value']) : "<Blank>"
      } else {
        val = row.getValue(columnId)['value'].length>0 ? row.getValue(columnId)['value'] : "<Blank>"
      }
    } else {
      val = "<Blank>"
    }

    let val2 = (value.length == 0) ? "<Blank>" : value
      
    // Rank the item
    const itemRank = rankItem(val, val2)
  
    // Store the itemRank info
    addMeta({
      itemRank,
    })
  
    // Return if the item should be filtered in/out
    return itemRank.passed
  }

  const rationaleFilter = (row, columnId, value, addMeta) => {
    
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId)['rationale'], value)
  
    // Store the itemRank info
    addMeta({
      itemRank,
    })
  
    // Return if the item should be filtered in/out
    return itemRank.passed
  }

  const gradeFilter = (row, columnId, value, addMeta) => {
    
    let grade = ""
    if ((row.getValue('_textPredictions') != null) && 
        (row.getValue('_textPredictions') != "") && 
        (row.getValue('_textPredictions') != "content_filter")){
      grade = Object.keys(row.getValue('_textLabel')).length==0 ? "<Blank>" : ((row.getValue('_textPredictions') == row.getValue('_textLabel')['text']) ? "✔" : "✘")
    } else {
      grade = "<Blank>"
    }

    let val = (value.length == 0) ? "<Blank>" : value

    // Rank the item
    const itemRank = rankItem(grade, val)
  
    // Store the itemRank info
    addMeta({
      itemRank,
    })
  
    // Return if the item should be filtered in/out
    return itemRank.passed
  }

  const exampleFilter = (row, columnId, value, addMeta) => {
    
    let example_flag = example_val_to_label(row.getValue('example')[0]['value'])

    // Rank the item
    const itemRank = rankItem(example_flag, value)
  
    // Store the itemRank info
    addMeta({
      itemRank,
    })
  
    // Return if the item should be filtered in/out
    return itemRank.passed
  }

  const textFilter = (row, columnId, value, addMeta) => {
    
    let val1 = row.getValue('text')
    console.log(val1)
    if (val1 != undefined){
      let text_content_obj = val1.find(({content_type}) => content_type === "text")
      val1 = text_content_obj['content_value']['text']
    }

    // Rank the item
    const itemRank = rankItem(val1, value)
  
    // Store the itemRank info
    addMeta({
      itemRank,
    })
  
    // Return if the item should be filtered in/out
    return itemRank.passed
  }

  const columns = useMemo(() => [
    columnHelper.accessor('_example', {
      id:'example',
      header: 'Chosen training example',
      cell: (info) => {
        let example = info.getValue()
        return flexRender(Item, {          
          item_id:info.row.original._id,
          itemContent:example!=undefined ? [{"text":example_val_to_label(example[0]['value'])}] : [{"text":""}],
          label:"example"
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = rowA.getValue(columnId)[0]['value'];
        const numB = rowB.getValue(columnId)[0]['value'];
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      filterFn:exampleFilter,
      size:50
    }),
    columnHelper.accessor('_example', {
      id:'example_select',
      header: 'Choose training example',
      cell: (info) => {
        let example = info.getValue()
        return flexRender(ItemCheckboxSet, {
          ref_id:analyser_id,
          checkbox_type:"local-example",
          item_id:info.row.original._id,
          itemLabels:example,
          label:"example",
          enableLabelling:enableExampleSelection,
          onChange: onExamplesChanged,
          isAsync:false
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = rowA.getValue(columnId)[0]['value'];
        const numB = rowB.getValue(columnId)[0]['value'];
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:50
    }),
    columnHelper.accessor('_sample', {
      id:'sample',
      header: 'Chosen test sample',
      cell: (info) => {
        let sample = info.getValue()
        return flexRender(Item, {          
          item_id:info.row.original._id,
          itemContent:sample!=undefined ? [{"text":example_val_to_label(sample[0]['value'])}] : [{"text":""}],
          label:"prediction-flag"
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = rowA.getValue(columnId)[0]['value'];
        const numB = rowB.getValue(columnId)[0]['value'];
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:50
    }),
    columnHelper.accessor('_sample', {
      id:'sample_select',
      header: 'Choose test sample',
      cell: (info) => {
        let sample = info.getValue()
        return flexRender(ItemCheckboxSet, {
          ref_id:analyser_id,
          checkbox_type:"sample",
          item_id:info.row.original._id,
          itemLabels:sample,
          label:"sample",
          enableLabelling:enableSampleSelection,
          onChange: onSampleChanged,
          isAsync:false
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = rowA.getValue(columnId)[0]['value'];
        const numB = rowB.getValue(columnId)[0]['value'];
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:50
    }),
    columnHelper.accessor('position', {
      id:'position',
      header: 'Item Order',
      cell: info => {return String(info.getValue())},
      enableColumnFilter:true,
      size:70
    }),
    columnHelper.accessor('object_id', {
      id: 'object_id',
      header: () => <span>ID</span>,
      cell: (info) => {
        return String(info.row.original.object_id != null ? info.row.original.object_id : "")
      },
      enableSorting:true,
      size:'auto'
    }),
    columnHelper.accessor('content', {
      id: 'image',
      header: () => <span>Image</span>,
      cell: (info) => {
        let val = info.getValue()
        let image_content_obj = val.find(({content_type}) => content_type === "image")
        if (enableLabelling){
          if (image_content_obj!=undefined){
            return flexRender(ItemImageLoader, {
              item_id:info.row.original._id,
              item_storage_id:image_content_obj['content_value']['image_storage_id']
            })
          }
        } else {
          if (image_content_obj!=undefined){
            return flexRender(ItemImageLoader, {
              item_id:info.row.original._id,
              item_storage_id:image_content_obj['content_value']['image_storage_id']
            })
          }
        }
      },
      enableSorting:false,
      enableColumnFilter: false
    }),
    columnHelper.accessor('content', {
      id: 'text',
      header: () => <span>Text</span>,
      cell: (info) => {
        let val = info.getValue()
        let text_content_obj = val.find(({content_type}) => content_type === "text")
        if (text_content_obj!=undefined){
          let label = info.row.original._textLabel
          let highlight = (label!=undefined && "highlight" in label) ? label['highlight'] : []
          return flexRender(TextHighlighter, {
            item_id: info.row.original._id,
            fullText: text_content_obj['content_value']['text'],
            highlight: highlight,
            onItemHighlight:onItemHighlight,
            ref_id: labelset_id
          })
        } 
      },
      enableSorting:false,
      filterFn: textFilter,
      size:"auto"
    }),
    columnHelper.accessor('_textLabel', {
      id: '_textLabel',
      header: () => <span>Your Label</span>,
      cell: (info) => {
        let label = info.getValue()
        if ((label!= undefined) && ('value' in label) && (label['type'] === 'binary')){
          label['text'] = binary_val_to_label(label['value'])
        }
        if ((label!= undefined) && ('value' in label) && (label['type'] === 'score')){
          label['text'] = label['value']
        }
        return flexRender(Item, {
          item_id:info.row.original._id,
          itemContent:label!= undefined ? [label] : [{"text":""}],
          label:"label"
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        let labelA = rowA.getValue(columnId)
        let labelB = rowB.getValue(columnId)
        let numA = -1
        let numB = -1
        if ('value' in labelA){
          numA = parseInt(labelA['value'])
        }
        if ('value' in labelB){
          numB = parseInt(labelB['value'])
        }
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      filterFn:labelFilter,
      size:100
    }),
    columnHelper.accessor('_textLabel', {
      id: '_textLabelRationale',
      header: () => <span>Reason for label</span>,
      cell: (info) => {
        let label = info.getValue()
        let rationale = (label!=undefined && "rationale" in label) ? {"text":label['rationale']} : {"text":""}
        return flexRender(Item, {
          item_id:info.row.original._id,
          itemContent:[rationale],
          label:"rationale"
        })
      },
      filterFn:rationaleFilter,
      enableSorting:false
    }),
    columnHelper.accessor('_textLabel', {
      id: '_textLabelRationale_edit',
      header: () => <span>Reason for label</span>,
      cell: (info) => {
        let label = info.getValue()
        let rationale = (label!=undefined && "rationale" in label) ? label['rationale'] : ""
        return flexRender(ItemTextInput, {
          ref_id:labelset_id,
          item_id:info.row.original._id,
          itemContent:rationale,
          onInputComplete:handleRationale
        })
      },
      filterFn:rationaleFilter,
      enableSorting:false,
      size:100
    }),
    columnHelper.accessor('_textLabel', {
      id: '_textLabelPositive',
      header: () => <span>Mark Present</span>,
      cell: (info) => {
        let label = info.getValue('_textLabel')
        return flexRender(ItemCheckboxSet, {
          ref_id:labelset_id,
          checkbox_type:"label",
          item_id:info.row.original._id,
          itemLabels:label!= undefined ? [label] : [{"text":""}],
          label:"positive",
          enableLabelling:enableLabelling,
          onChange: onLabelsChanged
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = "value" in rowA.getValue(columnId) ? parseInt(rowA.getValue(columnId)['value']) : -1
        const numB = "value" in rowB.getValue(columnId) ? parseInt(rowB.getValue(columnId)['value']) : -1
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:100
    }),
    columnHelper.accessor('_textLabel', {
      id: '_textLabelNegative',
      header: () => <span>Mark Absent</span>,
      cell: (info) => {
        let label = info.getValue('_textLabel')
        return flexRender(ItemCheckboxSet, {
          ref_id:labelset_id,
          checkbox_type:"label",
          item_id:info.row.original._id,
          itemLabels:label!= undefined ? [label] : [{"text":""}],
          label:"negative",
          enableLabelling:enableLabelling,
          onChange: onLabelsChanged
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const valA = parseInt(rowA.getValue(columnId)['value'])
        const valB = parseInt(rowB.getValue(columnId)['value'])
        const numA = "value" in rowA.getValue(columnId) ? (valA == 1 ? 0 : 1) : -1
        const numB = "value" in rowB.getValue(columnId) ? (valB == 1 ? 0 : 1) : -1
        // 1 (positive), 0 (negative), -1 (empty)
        // order: 0 > 1 > -1
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:100
    }),
    columnHelper.accessor('_textLabel', {
      id: '_textLabelScore',
      header: () => <span>Score</span>,
      cell: (info) => {
        let label = info.getValue('_textLabel') 
        return flexRender(ItemScoreSelector, {
          ref_id:labelset_id,
          item_id:info.row.original._id,
          itemLabels:label!= undefined ? [label] : [{"text":""}],
          onChange: onLabelsChanged
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = rowA.getValue(columnId)['value'];
        const numB = rowB.getValue(columnId)['value'];
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:100
    }),
    // columnHelper.accessor('_textLabel', {
    //   id: '_textLabelRationale',
    //   header: () => <span>Mark as Absent</span>,
    //   cell: (info) => {
    //     let label = info.getValue('_textLabel')
    //     return flexRender(Item, {
    //       item_id:info.row.original._id,
    //       itemContent:label!= undefined ? [label['rationale']] : [{"rationale":""}],
    //     })
    //   },
    //   enableColumnFilter:false
    // })
    // columnHelper.accessor('_textLabel', {
    //   id: '_textLabelRationale',
    //   header: () => <span>Mark as Absent</span>,
    //   cell: (info) => {
    //     let label = info.getValue('_textLabel')
    //     return flexRender(Item, {
    //       item_id:info.row.original._id,
    //       itemContent:label!= undefined ? [label['rationale']] : [{"rationale":""}],
    //     })
    //   },
    //   enableColumnFilter:false
    // })
    columnHelper.accessor('_textLabel', {
      id:'_textLabelExclude',
      header: 'Exclude',
      cell: (info) => {
        let label = info.getValue()
        return flexRender(ItemCheckboxSet, {
          ref_id:labelset_id,
          checkbox_type:"exclude",
          item_id:info.row.original._id,
          itemLabels:[label],
          label:"exclude",
          enableLabelling:enableLabelling,
          onChange: onLabelsChanged,
          isAsync:false
        })
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        const numA = rowA.getValue(columnId)['exclude'] == "true" ? 1 : 0;
        const numB = rowB.getValue(columnId)['exclude'] == "true" ? 1 : 0;
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      enableColumnFilter:false,
      size:50
    }),
    columnHelper.accessor('_textPredictions', {
      id: '_textPredictions',
      header: () => <span>Analyser Prediction</span>,
      cell: (info) => {
        if (info.getValue('_textPredictions') !== undefined){
          return flexRender(ItemPredictions, {
            item_id:info.row.original._id,
            predictions:[info.getValue('_textPredictions')]
          })
        }
      },
      filterFn: filterWithBlanks,
      size:100
    }),
    columnHelper.accessor('_textPredictions', {
      id: '_textPredictionsResult',
      header: () => <span>Prediction correct?</span>,
      cell: (info) => {
        if ((info.getValue('_textPredictions') !== undefined) && 
            (info.getValue('_textPredictions') !== "") && 
            (info.row.original._textLabel.type == 'binary')){
          if (info.getValue('_textPredictions') != "content_filter"){
            let result = Object.keys(info.row.original._textLabel).length==0 ? "?" : ((info.getValue('_textPredictions') == info.row.original._textLabel['text']) ? "✔" : "✘")
            return flexRender(Item, {
              item_id:info.row.original._id,
              itemContent:[{"text":result}],
              label:"grade",
              status: (result == "✔") ? "correct" : ((result == "✘") ? "incorrect":"unknown")
            })
          } else {
            return flexRender(Item, {
              item_id:info.row.original._id,
              itemContent:[{"text":""}],
              label:"grade",
              status: "filtered"
            })
          }
        } else if ((info.getValue('_textPredictions') !== undefined) && 
                    (info.getValue('_textPredictions') !== "") && 
                    (info.row.original._textLabel.type == 'score')) {
            if (info.getValue('_textPredictions') != "content_filter"){
              let diff = parseFloat(info.getValue('_textPredictions')) - parseFloat(info.row.original._textLabel['value'])
              let result = Object.keys(info.row.original._textLabel).length==0 ? "?" : (diff == 0 ? "": (diff > 0 ? "+" : "")) + diff
              let resultAbs = Object.keys(info.row.original._textLabel).length==0 ? "?" : Math.abs(diff)

              return flexRender(Item, {
                item_id:info.row.original._id,
                itemContent:[{"text":result}],
                label:"grade",
                status: (resultAbs <= 1) ? "correct" : ((resultAbs == 2) ? "average" : ((resultAbs > 2) ? "incorrect":"unknown"))
              })

            } else {
              return flexRender(Item, {
                item_id:info.row.original._id,
                itemContent:[{"text":""}],
                label:"grade",
                status: "filtered"
              })
            }

        } else {
          return ""
        }
      },
      sortingFn: (
        rowA,
        rowB,
        columnId
      ) => {
        let numA = null
        let numB = null
        if (rowA.original._textLabel.type == 'score'){
          let diffA = parseFloat(rowA.getValue('_textPredictions')) - parseFloat(rowA.original._textLabel['value'])
          let diffB = parseFloat(rowB.getValue('_textPredictions')) - parseFloat(rowB.original._textLabel['value'])
          numA = diffA
          numB = diffB
        } else {
          numA = Object.keys(rowA.getValue('_textLabel')).length==0 ? "<Blank>" : ((rowA.getValue(columnId) == rowA.getValue('_textLabel')['text']) ? "✔" : "✘");
          numB = Object.keys(rowB.getValue('_textLabel')).length==0 ? "<Blank>" : ((rowB.getValue(columnId) == rowB.getValue('_textLabel')['text']) ? "✔" : "✘");
        }
        return numA < numB ? 1 : numA > numB ? -1 : 0;
      },
      filterFn:gradeFilter,
      size:50
    })
  ])

  if (typeof(dataset) !== 'undefined'){

    return (
      <div className={"item-dynamic-list " + dataset['type']}>
        {enableExampleSelection && labelset.labels != undefined && examples != undefined ? (
          <div className="item-selector-select-intro">
            {dataset['type'] === 'text' && model_source != 'huggingface' ? (
              <>
              Please label at least 10 items and choose at least 5 training examples. All training examples need to be labelled.
              </>
            ) : (
              <>
              Please label at least 10 items and choose up to 5 training examples. All training examples need to be labelled.
              </>
            )} 
          </div>
        ) : (
          <></>
        )}
        {enableSampleSelection && sample_ids != undefined && useTab == false ? (
          <div className="item-selector-select-intro">
            Please choose at least 3 samples for testing. At least 3 of those need to be labelled so you can review the accuracy.
          </div>
        ) : (
          <></>
        )}
        {enableSampleSelection && sample_ids != undefined && useTab == true ? (
          <div className="item-selector-select-intro">
            Please choose at least 1 sample for predicting on another dataset. They don't have to be labelled.
          </div>
        ) : (
          <></>
        )}
        {((enableExampleSelection && labelset.labels != undefined && examples != undefined) || (enableSampleSelection && sample_ids != undefined)) && (model_source === "huggingface") && ((dataset['type']=='text') || dataset['type']=='textimage') ? ( // here
          <div className="item-selector-select-intro">
            Note: You are using the local model option. Try to select pieces of text up to 200 characters to avoid memory issues.
          </div>
        ) : (
          <></>
        )}
        {enableExampleSelection && labelset.labels != undefined && examples != undefined ? (
          <div className="item-selector-select-info">
            <b><i>You have selected {examples.length} training examples from a set of {labelset.labels.length} labelled items</i></b>     
          </div>
        ) : (
          <></>
        )}
        {enableSampleSelection && sample_ids != undefined ? (
          <div className="item-selector-select-info">
            <b><i>You have selected {sample_ids.length} items for testing predictions</i></b>
          </div>
        ) : (
          <></>
        )}
        <DynamicList
          name={dataset.name}
          combinedData={combinedData}
          columns={columns}
          sorting={sorting}
          onSorting={setSorting}
          columnVisibility={columnVisibility}
          robot_cols={robot_cols}
          showRobotItems={showRobotItems}
          expand_mode={expand_mode}
        ></DynamicList>
      </div>
    )

  } else {
    return <></>
  }
  
}
  
export default memo(ItemDynamicList)