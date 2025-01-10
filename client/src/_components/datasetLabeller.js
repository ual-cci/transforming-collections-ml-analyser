'use client'
 
import ItemDynamicList from './itemDynamicList'
import { useState, useEffect } from 'react'

const DatasetLabeller = ({
    dataset={
      id:"",
      name:"",
      artworks:[],
      dataset_type: ""
    },
    labelset=[],
    showLabels,
    enableLabelling,
    onLabelsChanged
  }) => {

    return (

        <div className="container">
            <div className='item-selector-heading'>
              <label><h4>Dataset Items:</h4></label><br/>
            </div>
            <ItemDynamicList 
              labelset_id={labelset._id}
              labelset_type={labelset.label_type}
              dataset={dataset} 
              labelset={labelset}
              examples={[]}
              predictions={[]} 
              sample_ids={[]} 
              enableLabelling={enableLabelling}
              showLabels={showLabels}
              showPredictions={false}
              showExamples={false}
              showRobotItems={false}
              onLabelsChanged={onLabelsChanged}
            />

            {
  }

          </div>);
          
        
}
  
export default DatasetLabeller