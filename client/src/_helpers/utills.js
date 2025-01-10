import { useState, useEffect, useMemo, useReducer, useRef, useCallback } from "react";
import { CSVLink, CSVDownload } from "react-csv";


const checkExamples = (examples, labelset, dataset, dataset_config, analyser_type, analyser_format, onFail, onWarning, model_source) => {
  
  console.log("checking examples")

  let labelled_examples = []
  let labelled_examples_ref = []
  let unlabelled_examples_ref = []
  let unlabelled_examples = []
  let unlabelled_positions = []
  let non_example_labels = []
  let pos_non_example_labels = []
  let neg_non_example_labels = []

  if (examples!= undefined && examples.length > 0){
    labelled_examples = labelset.labels.filter(({item_id}) => examples.includes(item_id))
    labelled_examples = labelled_examples.filter(label => label != "" && label != null)
    labelled_examples_ref = labelled_examples.map(a => a.item_id)
    unlabelled_examples_ref = examples.filter(item_id => !labelled_examples_ref.includes(item_id));
    unlabelled_examples = dataset.artworks.filter(({_id}) => unlabelled_examples_ref.includes(_id))
    unlabelled_positions = unlabelled_examples.map(a => a.position)
    non_example_labels = labelset.labels.filter(({item_id}) => !examples.includes(item_id))
    non_example_labels = non_example_labels.filter(label => label.toString().length > 0)
    if (analyser_type == "binary"){
      pos_non_example_labels = non_example_labels.map(label => {return label.value.toString() == "1"})
      neg_non_example_labels = non_example_labels.map(label => {return label.value.toString() == "0"})
    }
  }


  if (labelset.labels.length < 10) {
    onFail("Please label at least 10 items.")
    return {
      message:"Please label at least 10 items.",
      result:false
    }
  } else if (examples.length === 0) {
    if ((analyser_format === "text") && (model_source != "huggingface")) {
      onFail("No examples selected. Please select at least 5 labelled examples.")
      return {
        message:"No examples selected. Please select at least 5 labelled examples.",
        result:false 
      }
    } else if ((analyser_format.includes("image")) || (model_source === "huggingface")) {
      onFail("No examples selected. Please select up to 5 labelled examples.")
      return {
        message:"No examples selected. Please select up to 5 labelled examples.",
        result:false
      }
    }
  } else if ((examples.length < 5) && (analyser_format === "text") && (model_source != "huggingface")) {
    onFail("Not enough examples selected. Please select at least 5 labelled examples.")
    return {
      message:"Not enough examples selected. Please select at least 5 labelled examples.",
      result:false
    }
  } else if ((examples.length > 5) && ((analyser_format.includes("image")) || (model_source === "huggingface"))) {
    console.log(examples.length)
     onFail("Too many examples selected. Please select up to 5 labelled examples.")
    return {
      message:"Too many examples selected. Please select up to 5 labelled examples.",
      result:false
    }
  } else if (unlabelled_examples.length !== 0) {
    onFail("Please label all unlabelled examples (order number: " +  unlabelled_positions + ")")
    return {
      message:"Please label all unlabelled examples (" + unlabelled_positions + ")",
      result:false
    }
  } else if (non_example_labels.length==0){
    onFail("Please exclude at least one labelled item from your selected examples.")
    return {
      message:"Please exclude at least one labelled item from your selected examples.",
      result:false
    }
  }

  if (analyser_type == "binary"){
    if (pos_non_example_labels.length==0){
      onWarning("Before moving to review, please exclude at least one positively labelled item from your selected examples.")
      return {
        message:"Before moving to review, please exclude at least one positively labelled item from your selected examples.",
        result:true
      }
    }
    else if (countBy(labelled_examples, label => label.value.toString() === "1") < 3) {
      onWarning("To improve results, try selecting at least 3 examples with positive labels.")
      return {
        message:"To improve results, try selecting at least 3 examples with positive labels.",
        result:true
      }
    } else if ((countBy(labelled_examples, label => label.value.toString() === "0") < 2)) {
      onWarning("To improve results, try selecting at least 2 examples with negative labels.")
      return {
        message:"To improve results, try selecting at least 2 examples with negative labels.",
        result:true
      }
    }
  } else if (analyser_type == "score"){
    if (((countBy(labelled_examples, label => label.value.toString() === "0") / labelled_examples.length) < 0.1)) {
      onWarning("To improve results, try selecting more examples with a score of 0.")
      return {
        message:"To improve results, try selecting more examples with a score of 0.",
        result:true
      }
    }
    else if ((countBy(labelled_examples, label => (label.value.toString() == "1" || label.value.toString() == "2")) / labelled_examples.length) < 0.3) {
      onWarning("To improve results, try selecting more examples with low scores (between 1 and 2)).")
      return {
        message:"To improve results, try selecting more examples with low scores (between 1 and 2)).",
        result:true
      }
    }
    else if ((countBy(labelled_examples, label => (label.value.toString() == "3" || label.value.toString() == "4" || label.value.toString() == "5")) / labelled_examples.length) < 0.3) {
      onWarning("To improve results, try selecting more examples with high scores (between 3 and 5).")
      return {
        message:"To improve results, try selecting more examples with high scores (between 3 and 5).",
        result:true
      }
    }
  }

  // Clear error messages
  onWarning("")
  onFail("")
  return {
    message:"",
    result:true
  }

}

const checkSample = (sample, examples, labelset, onFail, onWarning, statusExists=false) => {

  let sample_items_labels = []
  let labelled_sample_items = []
  let non_example_labelled_sample_items = []
  let example_labelled_sample_items = []
  let non_example_labels = []

  if (sample!= undefined && sample.length > 0){
    sample_items_labels = labelset.labels.filter(({item_id}) => sample.includes(item_id))
    sample_items_labels = sample_items_labels.filter(label => label != "" && label != null)
    labelled_sample_items = sample_items_labels.map(a => a.item_id)
    non_example_labelled_sample_items = labelled_sample_items.filter(item_id => !examples.includes(item_id))
    example_labelled_sample_items = labelled_sample_items.filter(item_id => examples.includes(item_id))
    non_example_labels = labelset.labels.filter(({item_id}) => !examples.includes(item_id))
    non_example_labels = non_example_labels.filter(label => label.toString().length > 0)

  }

  if (sample.length < 3){
    onFail("Please select at least 3 labelled items for your sample")
    return false
  }

  if (labelled_sample_items.length < 3 && non_example_labels.length >= 3){
    onFail("Please select at least 3 labelled items for your sample")
    return false
  }

  if ((labelled_sample_items.length-example_labelled_sample_items.length) <= 2){
    onWarning("Before moving to review, please include at least 3 labelled items in your sample that are not examples")
    return true
  }

  if (!statusExists){
    // Clear error messages
    onWarning("")
    onFail("")
  }
  return true

}

const getItemListingID = (item_index, item_component_index) => {
    var itemTypeRef = "text"
    const id = ["artwork", String(item_index), itemTypeRef, String(item_component_index)].join("-")
    return id
}


const mergeArrays = (arr1 = [], arr2 = []) => {
    let res = [];
    res = arr1.map(obj => {
       const index = arr2.findIndex(el => el["id"] == obj["id"]);
       const { address } = index !== -1 ? arr2[index] : {};
       return {
          ...obj,
          address
       };
    });
    return res;
 }


const prepareCsvData = (dataset_artworks, results, labels, labelset_type, dataset_type, setCsvData) => {
  let dataset_with_preds = dataset_artworks.map((item) => {
    console.log(dataset_artworks)
    item.order = item.position
    if (labels.length > 0) {
      let label = labels.find((e) => (e.item_id === item["_id"]))
      if (typeof label !== "undefined") {
        if (labelset_type === 'binary') {
          item.label = (label.value === 0) ? 'negative' : 'positive'
        } else {
          item.label = label.value
        }
        item.rationale = label.rationale
      }
    }

    if (results.find((result)=>{return Object.keys(result).includes(item["_id"])})!=undefined){
      let item_result = results.find((result)=>{return Object.keys(result).includes(item["_id"])})
      item.predicted = item_result[item["_id"]]
    } else {
      item.predicted = ""
    }

    let allowed
    if (dataset_type === 'image') {
      item.id = item.content[0].content_value.text.replace(/,/g, "")
      allowed = ['order', 'id', 'predicted']
    }  
    else if (dataset_type === 'text') {
      item.text = item.content[0].content_value.text.replace(/,/g, "")
      allowed = ['order', 'text', 'predicted']
    }
    else if (dataset_type === 'textimage') {
      item.id = item.content[0].content_value.text.replace(/,/g, "")
      item.text = item.content[1].content_value.text.replace(/,/g, "")
      allowed = ['order', 'id', 'text', 'predicted']
    }
    if (labels.length > 0) {
      allowed.push('label', 'rationale')
    }
    if (dataset_artworks.some(e => e.object_id != null)) {
      allowed.push('object_id')
    }

    let filtered = Object.fromEntries(
      Object.entries(item).filter(
        ([key, val])=>allowed.includes(key)
      )
    )
    console.log(filtered)
    return filtered
  })

  let headers 
  headers = [
    { label: "order", key: "order" },
  ]
  if (dataset_artworks.some(e => e.object_id != null)) {
    headers.push({ label: "object_id", key: "object_id" })
  }
  if (dataset_type === 'image') {
    headers.push(
      { label: "filename", key: "id" },
      { label: "predicted", key: "predicted" }
    )
  }  
  else if (dataset_type === 'text') {
    headers.push(
      { label: "text", key: "text" },
      { label: "predicted", key: "predicted" }
    )
  }
  else if (dataset_type === 'textimage') {
    headers.push(
      { label: "filename", key: "id" },
      { label: "text", key: "text" },
      { label: "predicted", key: "predicted" }
    )
  }
  if (labels.length > 0) {
    headers.push({ label: "label", key: "label" })
  }
  if (labels.some(e => e.rationale != "")) {
    headers.push({ label: "rationale", key: "rationale" })
  }

  console.log(dataset_with_preds)
  setCsvData([dataset_with_preds, headers])
}

const binary_val_to_label = (val) => {
  if (val.toString() == "1"){
      return 'positive'
  } else if (val.toString() == "0"){
      return 'negative'
  } else {
      return ''
  }
}

const example_val_to_label = (val) => {
  if (val == 1){
      return '●'
  } else if (val == 0){
      return '----'
  } else {
      return ''
  }
}

const formatAccuracy = (accuracy) => {
  let score = parseFloat(accuracy).toFixed(2)
  console.log(score)
  let rating = ""
  if (score <=0.5) {
    rating = "Poor"
  } else if (score > 0.5 && score <= 0.7){
    rating = "OK"
  } else if  (score > 0.7 && score <= 0.8){
    rating = "Good!"
  } else if (score > 0.8){
    rating = "Excellent!"
  }

  let score_per = (score * 100).toFixed(0) + "%"
  return score_per + " (" + rating + ")"
}

const getGrade = (target,accuracy) => {
  let gap = parseFloat(target) - parseFloat(accuracy)
  if (gap <= 0.05){
    return "A"
  } else if (gap > 0.05 && gap <=0.15){
    return "B"
  } else if (gap > 0.15 && gap <=0.25){
    return "C"
  } else if (gap > 0.25 && gap <=0.35){
    return "D"
  } else {
    return "E"
  }
}

const formatAnalyserType = (analyser_type) => {

  let text = ""
  if (analyser_type == 'binary') {
    text = "Classify True or False"
  } else if (analyser_type == 'score'){
    text = "Give a score (0-5)"
  } else if  (analyser_type == 'keywords'){
    text = "Count keywords"
  }
  return text
}

function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseObjIdString(id_string){
  return id_string.replaceAll('"','')
}

const countBy = (array, checkFunction) => {
  return array.reduce((count, element) => {
    return checkFunction(element) ? count + 1 : count
  }, 0)
}

const dateFromObjectId = (objectId) => {
	return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};

const getFilterErrorString = (errors, allFiltered) => {

  let error_string = allFiltered === false ? "Some predictions were not processed due to the following flagged themes: " : "All predictions were not processed due to the following flagged themes: "
  let themes = []
  errors.map((e)=>{
    console.log(e)
    if (e['error']['code'] == "content_filter"){
      let content_filter_results = e['error']['inner_error']['content_filter_results']
      console.log(content_filter_results)
      for (const [key, value] of Object.entries(content_filter_results)){
        if(value['filtered']){
          let theme = key.replace("_"," ")
          themes.push(theme)
        }
      }
    }
  })
  themes = [...new Set(themes)]
  error_string+= themes.join(", ")
  return error_string
}

const usePrevious = (value, initialValue) => {
  const ref = useRef(initialValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const useEffectDebugger = (effectHook, dependencies, dependencyNames = []) => {
  const previousDeps = usePrevious(dependencies, []);

  const changedDeps = dependencies.reduce((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency
        }
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps);
  }

  useEffect(effectHook, dependencies);
};

const checkChanges = (version, previousVersion) => {
  if (previousVersion) {
    let changes = []
    if (version['task_description'] !== previousVersion['task_description']) {
      changes.push('task description')
    }
    if (version['labelling_guide'] !== previousVersion['labelling_guide']) {
      changes.push('labelling guide')
    }
    if (JSON.stringify(version['example_refs'].sort()) !== JSON.stringify(previousVersion['example_refs'].sort())) {
      changes.push('training examples')
    }
    if (JSON.stringify(version['sample_ids'].sort()) !== JSON.stringify(previousVersion['sample_ids'].sort())) {
      changes.push('test samples')
    }
    
    if (changes.length > 0) {
      return changes.join(', ')
    }
  }
}

const extract_no_filtered = (objects) => {
  return objects
  .filter(obj => Object.values(obj)[0] === 'content_filter')  
  .map(obj => Object.values(obj)[0])
  .length
}


 export {
    getItemListingID, 
    mergeArrays, 
    prepareCsvData,
    binary_val_to_label, 
    capitaliseFirstLetter, 
    parseObjIdString, 
    example_val_to_label,
    formatAnalyserType,
    formatAccuracy,
    getGrade,
    countBy,
    checkExamples,
    checkSample,
    dateFromObjectId,
    getFilterErrorString,
    useEffectDebugger,
    checkChanges,
    extract_no_filtered
}