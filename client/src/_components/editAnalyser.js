import Head from 'next/head'
import React, {useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import ItemDynamicList from '@/_components/itemDynamicList';
import ItemSelector from '@/_components/itemSelector';
import StatusBox from '@/_components/statusBox';
import ButtonFooter from './buttonFooter';
import { useSearchParams } from 'next/navigation'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'
import { formatAnalyserType, countBy, checkExamples, checkSample } from '@/_helpers/utills';
import { version } from 'jszip';
import InfoBox from './infoBox';

const EditAnalyser = ({
  user,
  analyser_id=null,
  analyser=null,
  editable=true,
  predictions=[],
  sample_ids=[],
  sectionLabels=["",""],
  getAnalyser=()=>{},
  onUpdate=()=>{},
  onComplete=()=>{},
  onError=()=>{},
  onWarning=()=>{},
  onSampleChange=()=>{},
  onExampleChange=()=>{},
  onTabChange=()=>{},
  setAnalyserStatus=()=>{},
  model_source
}) => {

  const [categories, setCategories] = useState([{}])

  const [analyser_name, setAnalyserName] = useState("")
  const [task_description, setTaskDescription] = useState("")
  const [labelling_guide, setLabellingGuide] = useState("")

  const [chosen_dataset_id, setChosenDatasetID] = useState("")
  const [chosen_category_id, setChosenCategoryID] = useState("")
  const [chosen_labelset_id, setChosenLabelsetID] = useState("")
  const [chosen_analyser_type, setChosenAnalyserType] = useState("")
  const [chosen_version, setChosenVersion] = useState("")
  const [version_predictions,setVersionPredictions] = useState([])

  const [labelset, setLabelset] = useState({})
  const [dataset, setDataset] = useState({
    "_id":"",
    "artworks":[]
  })
  const [examples, setExamples] = useState([])
  const [sample, setSample] = useState([])
  const [accuracy, setAccuracy] = useState("")

  const [editMode,setEditMode] = useState(true)
  const [analyser_config, setAnalyserConfig] = useState({
    "num_examples":"5",
    "auto_select_examples":"false",
    "examples_start_index":"0",
    "examples_end_index":"0",
    "num_predictions":"20",
    "auto_select_sample":"false",
    "preds_start_index":"0",
    "preds_end_index":"0"
  })

  const [tabIndex, setTabIndex] = useState(0);
  const [tabsDisabled, setTabsDisabled] = useState({
    0:false,
    1:true,
    2:true,
  })

  const [actionTexts, setActionTexts] = useState([])
  const [actionFunctions, setActionFunctions] = useState([])
  const [actionData,setActionData] = useState({})

  const getLabelset = (labelset_id) => {

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'}
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset?" + new URLSearchParams({
      labelset_id:labelset_id,
      include_labels:true
    }), requestOptions)
    .then(res => res.json()).then((res) => {
      setLabelset(res.data)
      console.log(res)
      if ('labelling_guide' in res.data && res.data['labelling_guide']!=undefined && labelling_guide==""){
        console.log(res.data['labelling_guide'])
        setLabellingGuide(res.data['labelling_guide'])
      }
    })
  }

  const getDataset = (dataset_id) => {

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'}
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset?" + new URLSearchParams({
      dataset_id:dataset_id,
      include_items:true
    }), requestOptions)
    .then(res => res.json()).then((res) => {
      setDataset(res.data)
    })
  }

  const updateAnalyser = (newVersion, data, analyser_id, config="", latest_sample_ids="") =>{
    console.log("update analyser")
    console.log(data)
    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    let update_data = {}

    if (data["chosen_analyser_type"]!=analyser.analyser_type) update_data['analyser_type'] = data["chosen_analyser_type"]
    if (data["task_description"]!=analyser.task_description) update_data['task_description'] = data["task_description"]
    if (data["labelling_guide"]!=analyser.labelling_guide) update_data['labelling_guide'] = data["labelling_guide"]
    if (data["chosen_dataset_id"]!=analyser.dataset_id) update_data['dataset_id'] = data["chosen_dataset_id"]
    if (data["chosen_category_id"]!=analyser.category_id) update_data['category_id'] = data["chosen_category_id"]
    update_data['labelset_id'] = data["chosen_labelset_id"]
    if (data["examples"]!=analyser.example_refs) update_data['example_refs'] = data["examples"]
    if (data["sample_ids"]!=analyser.sample_ids) update_data['sample_ids'] = data["sample_ids"]
    if (data["analyser_format"]!=analyser.analyser_format) update_data['analyser_format'] = data["analyser_format"]

    console.log(update_data)

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_update?"+ new URLSearchParams({
      analyser_id:analyser_id,
      update_data:JSON.stringify(update_data),
      analyser_config:JSON.stringify(config),
      new_version:newVersion
    }), requestOptions)
    .then(response => response.json())
    .then(res => {
      console.log(res)
      if(res.status=="500"){
        console.log(res['error'])
        onError(res['error'])
      } else {
        console.log("calling onupdate")
        onUpdate(analyser_id, config, latest_sample_ids)
      }
    })
  }

  const handleTabChange = (tab_index) => {
    setTabIndex(tab_index)
    if (tab_index == 0){
      setActionTexts(["Next: Select sample to test"])
      setActionFunctions([handleSelectSample])
    } else if (tab_index == 1){
      setActionTexts(["Next: Test Sample"])
      setActionFunctions([handleTest])
    } else if (tab_index == 2){
      setActionTexts(["Back: Change Analyser Details","Back: Change Sample","Retry Predictions"])
      setActionFunctions([
        (data)=>{handleTabChange(0)},
        (data)=>{handleTabChange(1)},
        handleRetest])
    }
    window.scrollTo({
      top:0,
      behavior: "smooth"
    })
    onError("")
    onTabChange()
  }

  useEffect(() => {
    
    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/categories?"+ new URLSearchParams({
      user_id:user.sub
    }))
    .then(
      response => response.json()
    ).then(
      res => {
        setCategories(res.data)
      }
    )

    if (predictions.length>0) {
      setTabsDisabled({
        0:false,
        1:false,
        2:false
      })
      handleTabChange(2)
      setEditMode(false)
    } else {
      setEditMode(true)
      if(examples.length==0){
        setTabsDisabled({
          0:false,
          1:true,
          2:true
        })
        handleTabChange(0)
      }else{
        setTabsDisabled({
          0:false,
          1:false,
          2:true
        })
        handleTabChange(1)
      }
    }

  },[])

  const onLabelsChanged = (e) => {
    onError("") 
    if ('labelset_id' in analyser){
      getLabelset(analyser.labelset_id)
    } else {
      getLabelset(chosen_labelset_id)
    }
  }

  const onConfigChanged = (updated_config) => {
    let new_config = {
      ...analyser_config,
      ...updated_config
    }
    setAnalyserConfig(new_config)
  }

  const onSampleChanged = (item_ref,analyser_id) => {
    onError("") 
    let item_id = item_ref.split('artwork-')[1].split('-')[0]
    let newSample = JSON.parse(JSON.stringify(sample_ids))
    if (sample_ids.includes(item_id)){
      newSample = newSample.filter(id => {
        return id != item_id
      })
    } else {
      newSample.push(item_id)
    }
    setSample(newSample)
  }

  const onExamplesChanged = (item_ref,analyser_id) => {
    onError("") 
    let item_id = item_ref.split('artwork-')[1].split('-')[0]
    let newExamples = JSON.parse(JSON.stringify(examples))
    if (examples.includes(item_id)){
      newExamples = newExamples.filter(id => {
        return id != item_id
      })
    } else {
      newExamples.push(item_id)
    }
    setExamples(newExamples)
    onExampleChange()
  }

  const handleUpdate = (data) => {
    onError("") 
    console.log("handleUpdate")
    let new_v_flag = !data['editMode']
    if ((data['tab_index'] == 0)){
      setTabsDisabled({
        0:false,
        1:true,
        2:true
      })
    } else if (data['tab_index'] == 1){
      setTabsDisabled({
        0:false,
        1:false,
        2:true
      })
    }
    setAnalyserStatus("Updating analyser...")
    updateAnalyser(new_v_flag,data['update_data'],data["analyser"]['_id'])
  }

  const handleSelectSample = (data) => {
    onError("") 
    if (data['labelset'].labels.length < 10) {
      onError("Please label at least 10 items.") 
    } else if(data['analyser_config']['auto_select_examples']=='false'){
      console.log("Autoselect is false")
      let examples_check = checkExamples(data['examples'],data['labelset'],data['dataset'],data['analyser_config'],data['chosen_analyser_type'],data['analyser_format'],data['onError'],data['onWarning'], model_source)
      if (examples_check.result){
        setTabsDisabled({
          0:false,
          1:false,
          2:true
        })
        handleTabChange(1)
      } else {
        setTabsDisabled({
          0:false,
          1:true,
          2:true
        })
      }
    } else {
      setTabsDisabled({
        0:false,
        1:false,
        2:true
      })
      handleTabChange(1)
    }
  }

  const handleTest = (data) => {
    onError("") 
    setTabsDisabled({
      0:false,
      1:false,
      2:true
    })
    let new_v_flag
    if(analyser['versions'].length === 1 && version_predictions.length === 0) {
      new_v_flag = true
    } else {
      new_v_flag = !data['editMode']
    }
    if(data['analyser_config']['auto_select_sample']=='false'){
      let is_message_set = false
      let sample_result = checkSample(data['sample'],data['examples'],data['labelset'],data['onError'],data['onWarning'],is_message_set)
      if (sample_result){
        setAnalyserStatus("Updating analyser...")
        updateAnalyser(new_v_flag,data['update_data'],data["analyser"]['_id'],data['analyser_config'],data['sample'])
        setEditMode(false)
      } else {
        console.log("Didn't pass sample check")
      }
    } else {
      setAnalyserStatus("Updating analyser...")
      updateAnalyser(new_v_flag,data['update_data'],data["analyser"]['_id'],data['analyser_config'],data['sample'])
      setEditMode(false)
    }
  }

  const handleRetest = (data) => {
    onError("") 
    onComplete(data["analyser"]['_id'],data['analyser_config'],data['sample'])
  }

  useEffect(() => {
    if (chosen_labelset_id!= ""){
      getLabelset(chosen_labelset_id)
    } else {
      setLabelset({})
    }
  }, [chosen_labelset_id])

  useEffect(() => {
    if (chosen_dataset_id!= ""){
      getDataset(chosen_dataset_id)
    } else {
      setDataset({})
    }
  }, [chosen_dataset_id])

  useEffect (()=>{
    onSampleChange(sample)
  },[sample])

  useEffect (()=>{
    if (tabIndex==1){
      setTabsDisabled({
        0:false,
        1:false,
        2:true
      })
    }
  },[sample_ids])

  useEffect(() => {
    console.log("NEW ANALYSER!")
    console.log(analyser)

    if (analyser!=null && Object.keys(analyser).length!=0){
      setAnalyserName(analyser.name)
      setTaskDescription(analyser.task_description)
      setLabellingGuide(analyser.labelling_guide)
      setChosenCategoryID(analyser.category_id)
      setChosenAnalyserType(analyser.analyser_type)
      setChosenDatasetID(analyser.dataset_id)
      setChosenLabelsetID(analyser.labelset_id)
      setSample(analyser.sample_ids)
      setExamples(analyser.example_refs)
      setChosenVersion(analyser.version)
      getDataset(analyser.dataset_id)
      getLabelset(analyser.labelset_id)
    }
  }, [analyser])

  useEffect (()=>{
    console.log("predictions update")
    console.log(predictions)
    if (predictions.length>0 && tabIndex!=2) {
      setTabsDisabled({
        0:false,
        1:false,
        2:false
      })
      handleTabChange(2)
    }
    if (predictions.length==0){
      if(tabIndex==2){
        if(sample_ids.length==0){
          setTabsDisabled({
            0:false,
            1:true,
            2:true
          })
          handleTabChange(0)
        }else{
          setTabsDisabled({
            0:false,
            1:false,
            2:true
          })
          handleTabChange(1)
        }
      }
    }
    setVersionPredictions(predictions)
  },[predictions])


  return (
    <main className="edit_analyser">
      <Tabs className="steps steps-3" selectedIndex={tabIndex} onSelect={handleTabChange}>
        <TabList>
          {sectionLabels.map((label,index)=>{
            return <Tab key={"tab-" + index} disabled={tabsDisabled[index]}>{label}</Tab>
          })}
        </TabList>

        <TabPanel>
          <form>
            <label><h4>Analyser Details:</h4></label><br/>

              <label><span className="label-header">Task Description:</span></label>
              <span className="material-symbols-outlined robot-icon">smart_toy</span>
              <br/>
              <textarea className="wide_input" type="text" name="description" required onChange={e => setTaskDescription(e.target.value)} 
                value={task_description}
                placeholder='eg. "Analyse descriptions of artworks to see if they include derogatory terms. If the artwork includes a term, flag as "True" and if it does not, flag as "False""'
              />
              <br/>

              {/* <label><span className="label-header">Category (Optional):</span></label>
              <select name="category_id" required onChange={e => setChosenCategoryID(e.target.value)} 
                value={chosen_category_id}>
                <option value="">Select a category</option>
                {categories.map(function(category) {
                  return(
                    <option key={"category-"+category._id} value={ category._id }>{ category.name }</option>
                  )
                })}
              </select>
              <br/> */}

          </form>
          <hr/>
          <label><h4>Labelling Details:</h4></label><br/>
            {(analyser.analyser_type != "") ? (
              <p><span className="label-header">Label Type:</span> {formatAnalyserType(analyser.analyser_type)}</p>
            ) : (
              <></>
            )}

            <label><span className="label-header">Labelling Guide:</span></label>
            <span className="material-symbols-outlined robot-icon">smart_toy</span>
            <br/>
            <textarea className="wide_input" type="text" name="labelling_guide" required onChange={e => setLabellingGuide(e.target.value)} 
              value={labelling_guide}
              placeholder='eg. "Here is as list of key derogatory terms and phrase types that you should look for...."'
            />
            <br/>

            {(analyser.labelset_id != "" && analyser.dataset_id != "") ? (
              <>
                <p><span className="label-header">Dataset:</span> {analyser.dataset_name}</p>
                <p><span className="label-header">Labelset:</span> {analyser.labelset_name}</p>
                <p><i>Note: To use another label type, dataset or labelset you will need to create a new analyser.</i></p>
              </>
            ) : (
              <></>
            )}

          <hr></hr>     
          {(dataset!=undefined && Object.keys(dataset).length!=0) ? (

            <>
              <div className='item-selector-heading'>
                <label><h4>Label data and select labelled examples for training:</h4></label>
              </div>
              
              <ItemSelector
                labelset_id={chosen_labelset_id}
                labelset_type={labelset.label_type}
                dataset={dataset}
                labelset={(labelset!=undefined && Object.keys(labelset).length!=0) ? labelset : {"_id":"","labels":[]}}
                examples={examples}
                sample_ids={sample_ids}
                predictions={version_predictions}
                showPredictions={false}
                showExamples={false}
                showSample={true}
                showLabels={true}
                showGrade={false}
                enableLabelling={true}
                enableExampleSelection={true}
                onLabelsChanged={onLabelsChanged}
                onExamplesChanged={onExamplesChanged}
                onConfigChanged={onConfigChanged}
                analyser_id={analyser_id}
                selector_type="examples"
                expand_mode={"expanded"}
                model_source={model_source}
                />
            </>
          ) : <></>}
      </TabPanel>
      <TabPanel>
        {(dataset!=undefined && Object.keys(dataset).length!=0) ? (
            <>
              <div className='item-selector-heading'>
                <label><h4>Select labelled items for testing:</h4></label><br/>
              </div>

              <ItemSelector
                analyser_id={analyser_id}
                dataset={dataset}
                labelset_id={chosen_labelset_id}
                labelset={(labelset!=undefined && Object.keys(labelset).length!=0) ? labelset : {"_id":"","labels":[]}}
                examples={examples}
                sample_ids={sample_ids}
                predictions={version_predictions}
                showPredictions={false}
                showExamples={true}
                showSample={true}
                showLabels={true}
                showGrade={false}
                enableLabelling={false}
                onConfigChanged={onConfigChanged}
                onSampleChanged={onSampleChanged}
                selector_type="predictions"
                expand_mode={"expanded"}
                model_source={model_source}
                />
            </>
          ) : <></>}
      </TabPanel>
      <TabPanel>
        {((version_predictions.length>0) && (dataset!=undefined) && (Object.keys(dataset).length!=0)) ? (
            <>
              <div className='item-selector-heading'>
                <h4>View test results:</h4>
              </div>
              <ItemDynamicList 
                labelset_id={chosen_labelset_id}
                labelset={(labelset!=undefined && Object.keys(labelset).length!=0) ? labelset : {"_id":"","labels":[]}}
                labelset_type={labelset.type}
                dataset={dataset}
                predictions={version_predictions}
                examples={examples}
                sample_ids={sample_ids}
                enableExampleSelection={false}
                enableSampleSelection={false}
                enableLabelling={false}
                showPredictions={true}
                showExamples={true}
                showSample={true}
                showLabels={true}
                showGrade={true}
                showRobotItems={true}
                onLabelsChanged={onLabelsChanged}
                onExamplesChanged={onExamplesChanged}
                onSampleChanged={onSampleChanged}
                analyser_id={analyser_id}
              />
            </>
          ) : (
          <></>)}
      </TabPanel>
      </Tabs>

      <br/>
      <br/>
      {analyser_id!="" ? (
        <>
          <ButtonFooter
            buttonTexts={actionTexts}
            buttonActions={actionFunctions}
            buttonData={{
              "editMode":editMode,
              "tab_index":tabIndex,
              "analyser":analyser,
              "labelset":labelset,
              "sample_ids":sample_ids,
              "sample":sample,
              "examples":examples,
              "predictions":predictions,
              "dataset":dataset,
              "analyser_config":analyser_config,
              "analyser_format":dataset['type'],
              "chosen_analyser_type":chosen_analyser_type,
              "update_data":{
                "dataset_id":dataset['_id'],
                "analyser_format":dataset['type'],
                "task_description":task_description,
                "chosen_analyser_type":chosen_analyser_type,
                "labelling_guide":labelling_guide,
                "chosen_dataset_id":chosen_dataset_id,
                "chosen_category_id":chosen_category_id,
                "chosen_labelset_id":chosen_labelset_id,
                "sample_ids":sample_ids,
                "examples":examples
              },
              "onError":onError,
              "onWarning":onWarning
            }}
          />
        </>   
      ) : (<></>)
      
      }
        <br/>
        <br/>
      </main>
  )
}

export default EditAnalyser