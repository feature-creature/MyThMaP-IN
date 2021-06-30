"use strict";

//  global data variables
let globalDS = {"links":[],"nodes":[]};
let outputData = {};
let configData, configStyle, ticks, environment;
let [migrants, families, interactions, employers, intermediaries] = [ {}, {}, {}, [], [] ];

//  global interface variables
let pauseModelButton, showMigrantNuclearFamilyLinks, showIntermediaryIntermediaryLinks, showAgencyLinks, showIntermediaryEmployerLinks, showEmployerThailandDocBrokerLinks;
let restartModelButton, exportDataButton, fullscreenButton, scenarioRadio;
let [ migrantNuclearFamilyLinksBool, intermediaryIntermediaryLinksBool, agencyLinksBool, intermediaryEmployerLinksBool, EmployerThailandDocBrokerLinksBool ] = [ true, false, false, false, false ];
let preferenceProximity, preferenceFees, preferencePassport, preferenceWage, preferenceSector, preferenceWorkPermit, preferenceSocial, preferenceFamily, preferenceNone;
let [verify, iterations, start, scenario, seed] = [ false, false, false, false, false ];

//  load model configuration data 
function preload(){ 
  configData = loadJSON("data/config-data.json"); 
  configStyle = loadJSON("data/config-style.json");
}


//  initialize model
function setup() {
  let cnv = createCanvas( 1920, 1080 );
  cnv.parent("abm");
  frameRate(30);
  noLoop();
  setupInterface();

  arrayToVecSubarea(configData.environment.subareas);
  arrayToVecProtoarea(configData.offices);
  arrayToVecProtoarea(configData.agencies);

  setupModel();
  // randomSeed( seed );
}


//  run model
function draw() {
  clear();
  //  1. draw environment
  environment.draw();
  
  //  2. update agent locations
  Migrant.movePopulation( migrants );
  Intermediary.movePopulation( intermediaries );
  
  //  3. update agent finances
  Migrant.updateWealthPopulation( migrants );
  Family.calculateAverageWealth( families, environment.subareas );
  
  //  4. update agent states and interactions
  interactions[frameCount] = [];
  Intermediary.makeOfferPopulation( intermediaries, migrants );
  Migrant.updatePopulation( migrants, families, Family.relativeWealths, interactions, intermediaries, employers );
  Migrant.storeStateAndWealthPopulation( migrants );

  //  5. draw agent classes and agent interactions
  Employer.drawPopulation( employers, intermediaries );
  Intermediary.drawPopulation( intermediaries, employers );
  if(migrantNuclearFamilyLinksBool) Family.drawLinks( families, migrants );
  Migrant.drawPopulationInteractions( migrants, interactions );
  Migrant.drawPopulation( migrants );
  
 /* 
  push();
  let m = migrants["m10"].loc;
  let c = get( m.x - 30, m.y - 30, 60, 60 );
  stroke(0);
  noFill();
  line( m.x, m.y, width*0.35 + 100, height*0.75 + 100 );
  strokeWeight(3);
  rect( m.x - 30, m.y - 30, 60, 60 );
  rect( width*0.35-2, height*0.75 -2, 229, 229 )
  image( c, width*0.35, height*0.75, 225, 225 );
  noStroke();
  fill(0);
  text("Migrant 10",width*0.35,height*0.75 -20 );
  pop();      
*/
  
  //  6. monitor model run time
  addOutputData();

  // combine and unique
  // combineUnique( globalDS, networkData(frameCount) );
  // combineUnique( globalDS, networkData(frameCount) );
  // networked( globalDS );
  // networked( networkData(frameCount) );
  isModelRunComplete( frameCount, ticks );
  // if(
  //   frameCount == 365  || 
  //   frameCount == 730  ||
  //   frameCount == 1095 ||
  //   frameCount == 1480 ||
  //   frameCount == 1825 
  //   ){
  //   networkData(frameCount);
  // }
}

function addOutputData(){
  let states = {"premigration":0,"planning":0,"transit":0,"employed":0};
  
  for(const [k, v] of Object.entries( migrants )){
    states[ v.state ] += 1;
  }
  outputData[frameCount].s = states;
}


//  stop model
function isModelRunComplete( currentTick, totalTicks ){ 
  if( currentTick >= totalTicks ) noLoop(); 
}

function exportData(){
  saveJSON( outputData, `MyTh-MAP-IN-${Date.now()}.json` );
}

function downloadDataAndRestart( v, i, s, sd, sc){
  console.log("download data and restart")
  // if(v == 1) generateDataSubModel1( migrants, families, intermediaries, employers );
  // if(v == 2) generateDataSubModel2( migrants, families, intermediaries, employers );
  // if(v == 3) generateDataSubModel3( migrants, families, intermediaries, employers );
  // if(v == 4) generateDataSubModel4( migrants, families, intermediaries, employers );
  // saveJSON( {"scenario":scenario, "seed": seed}, `scenario-${scenario}-seed-${seed}-${Date.now()}.json` );

  // final output
  // generateScenarioData( migrants, families, intermediaries, employers );
  
  // setTimeout(function(){ 
  //   let nextStart = s + 1;
  //   let nextSeed = sd + 1;
  //   if(s < i){
  //     window.location.href = 
  //       window.location.origin +
  //       window.location.pathname + "?a=0" +
  //       "&verify=" + v +
  //       "&start=" + nextStart +
  //       "&iterations=" + i +
  //       "&seed=" + nextSeed +
  //       "&scenario=" + sc
  //   }  
  // }, 10000);

}

function combineUnique( gds, tds ){

  // find unique set new entries
  let newds = {"links":[],"nodes":[]};

  const existingNodes = gds.nodes.map(n => n.id)
  const newNodes = tds.nodes.filter(n => !existingNodes.includes(n.id) );

  const existingSTs = gds.links.map(l => l.source.id+ " "+l.target.id);
  const newSTs = tds.links.filter((l) => !existingSTs.includes(l.source.id+ " "+l.target.id));


  networked( {"links":newSTs, "nodes":newNodes} );

  newds.links = gds.links.concat( newSTs );
  newds.nodes = gds.nodes.concat( newNodes );
 
  gds.links = newds.links;
  gds.nodes = newds.nodes;
  // const ids = cds.nodes.map(o => o.id)
  // const filteredNodes = cds.nodes.filter(({id}, index) => !ids.includes(id, index + 1))

  // const sourceTargets = cds.links.map(l => l.source.id+ " "+l.target.id);
  // const filteredsourceTargets = cds.links.filter((l, index) => !sourceTargets.includes(l.source.id+ " "+l.target.id, index + 1))


  // // console.log( filteredNodes )
  // cds.nodes = filteredNodes;
  // cds.links = filteredsourceTargets;


}


function networkData( fc ){
  let ds = { "nodes":[], "links":[] };
  for( const [id, m] of Object.entries( migrants ) ){ 

    let ms = m.migrations.length;
    if( ms > 0 ){      
      // add migrant node
      if( ds.nodes.filter( n => n.id == id ).length == 0 ){
        ds.nodes.push( { "id":id, "t":m.constructor.name, "ms":ms } );
      }

      // look through each migration
      for( let i=0; i<ms; i++ ){
        // each member of the migration network
        for( let q=0; q<m.migrations[ i ].migrationNetwork.length; q++ ){
          let mnaid = m.migrations[ i ].migrationNetwork[q];
          // if not self
          if( id != mnaid ){
            let t = "Migrant";
            let mnaidl;
            if( mnaid[0] == "i" ){
              t = intermediaries[ mnaid.substring(1) ].constructor.name;
              mnaidl = intermediaries[ mnaid.substring(1) ].links;
            } 
            if( mnaid[0] == "e" ){
              t = employers[ mnaid.substring(1) ].constructor.name;
              mnaidl = employers[ mnaid.substring(1) ].links
            } 

            // add new network member node
            if( ds.nodes.filter( n => n.id == mnaid ).length == 0 ){
              let tms = t == "Migrant" ? migrants[mnaid].migrations.filter(m => m.completed == true).length : 0;
              ds.nodes.push( { "id":mnaid, "t":t, "ms": tms } );
            }
            // add new link from migrant to network member
            if( ds.links.filter( l => ( l.source == id && l.target == mnaid )||( l.source == mnaid && l.target == id ) ).length == 0 ){
              ds.links.push( {"source":id, "target":mnaid} );
            }
            
            if( t != "Migrant" ){
              // add new link between pre-linked network members
              // m.migrations[ i ].migrationNetwork[q]
              for( let j=q; j<m.migrations[ i ].migrationNetwork.length; j++ ){
                let mnaid2 = m.migrations[ i ].migrationNetwork[ j ];
                if(
                  mnaid2 != mnaid &&
                  ds.links.filter( l => ( l.source == mnaid && l.target == mnaid2 )||( l.source == mnaid2 && l.target == mnaid ) ).length == 0 
                ){
                  if(mnaidl != undefined){
                    // is mnaid2 in mnaid's intermediary links?
                    for( let k=0; k<mnaidl.intermediaries.length; k++ ){
                      if( mnaidl.intermediaries[k] == mnaid2.substring[1] ){
                        ds.links.push( {"source":mnaid, "target":mnaid2} );
                      }
                    }
                    // is mnaid2 in mnaid's intermediary links?
                    for( let k=0; k<mnaidl.employers.length; k++ ){
                      if( mnaidl.employers[k] == mnaid2.substring[1] ){
                        ds.links.push( {"source":mnaid, "target":mnaid2} );
                      }
                    }
                  }
                  if(t == "Recruiter" && mnaid2[0] == "e" ){
                    let a = intermediaries[ mnaid.substring(1) ].agency;
                    let aemps = environment.agencies[a].employers;
                    if( aemps.includes(mnaid2) ){
                      ds.links.push( {"source":mnaid, "target":mnaid2} );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  // add family links
  for( let i=0; i<ds.nodes.length; i++ ){
    let n1 = ds.nodes[i];
    if( n1.id[0] == "m" ){
      let f = families[ migrants[ n1.id ].family ].extendedFamilies;
      f.push( migrants[ n1.id ].family );
      for( let j=i; j<ds.nodes.length; j++ ){
        let n2 = ds.nodes[j];
        if( 
          n2.id != n1.id &&
          n2.id[0] == "m" &&
          f.includes( migrants[ n2.id ].family )
        ){
          ds.links.push( {"source":n1.id, "target":n2.id} );
        }
      }      
    }

    // recruiter agency connections
    if( n1.id[0] == "i" && intermediaries[ n1.id.substring(1) ].constructor.name == "Recruiter" ){
      let a = intermediaries[ n1.id.substring(1) ].agency;
      for( let j=i; j<ds.nodes.length; j++ ){
        let n2 = ds.nodes[j];
        if( 
          n2.id != n1.id &&
          n2.id[0] == "i" &&
          intermediaries[ n2.id.substring(1) ].constructor.name == "Recruiter"
        ){
          if( a == intermediaries[ n2.id.substring(1) ].agency ){
            ds.links.push( {"source":n1.id, "target":n2.id} );
          }
        }
      }      
    }

  }

  // add recruiter links through agency
  // add thai doc brokers + their links to migrants and employers


  // first add all nodes and migrant links
  // then add intermediary <-> intermediary (same migration)
  // and  add intermediary <-> employer (same migration)
  // timestep
  // add family / extended family links
  // add recruiter / agency links

  // thai doc brokers links 
  // saveJSON( ds, `sociocentric-${seed}-${fc}-${Date.now()}.json` );

  return ds;
}


function parse_query_string(query) {
  var vars = query.split("&");
  var query_string = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    // If first entry with this name
    if (typeof query_string[key] === "undefined") {
      query_string[key] = decodeURIComponent(value);
      // If second entry with this name
    } else if (typeof query_string[key] === "string") {
      var arr = [query_string[key], decodeURIComponent(value)];
      query_string[key] = arr;
      // If third or later entry with this name
    } else {
      query_string[key].push(decodeURIComponent(value));
    }
  }
  return query_string;
}


function familyShocks(fs){
  let famShocks = [];
  for(const [k, v] of Object.entries( fs )) famShocks.push( [ k, v.financialShocks ] );
  console.table(famShocks);
  return famShocks;
}

function resetSketch(){
  frameCount = 0;
  pauseModelButton.html("Start");
  scenario = scenarioRadio.value();

  ticks = 0;
  environment = {}; 
  employers = [];
  intermediaries = [];
  migrants = {};
  families = {}; 
  interactions = {};
  globalDS = {"links":[],"nodes":[]};
  outputData = {};

  setupModel(); 
  noLoop();
  redraw();
} 


//  setup model
function setupModel(){
  
  //  S1. setup time and environment
  ticks = configData.ticks;
  environment = new Environment( configData.environment, configData.offices, configData.agencies );
  
  //  S2. setup agent classes
  Employer.setupPopulation( employers, configData.agents.employers, environment.subareas );
  Intermediary.setupPopulation( intermediaries, configData.agents.intermediaries, environment.subareas, environment.offices, Object.keys(environment.agencies).length );
  Migrant.setupPopulation( migrants, configData.agents.migrants, environment.subareas );
  Family.setupExtendedFamilies(families);
  
  //  S3. setup agency rosters, agent offers, and agent links
  Agency.setupEmployerRosters( environment.agencies, intermediaries.filter(i => i.constructor.name == "Recruiter"), employers );
  Intermediary.setupOfferPopulation(intermediaries, employers);
  Employer.setupIntermediaryLinks( employers, intermediaries, configData.links.employerToIntermediary );
  Intermediary.setupIntermediaryLinks( intermediaries, configData.links.intermediaryToIntermediary );
  Intermediary.setupEmployerLinks( intermediaries, employers, configData.links.intermediaryToEmployer );
  
  //  S4. monitor model initial state
  console.log(`model: ${Object.keys(migrants).length} migrants, ${intermediaries.length} intermediaries, ${employers.length} employers`);
  textSize(20);

  //setup outputData
  for(let i=1; i<=ticks; i++){
    outputData[i] = {
      "s":{"premigration":0,"planning":0,"transit":0,"employed":0},
      "ao":{"Facilitator":0, "Recruiter":0, "MyanmarDocumentBroker":0, "ThailandDocumentBroker":0, "Smuggler":0, "Family":0 }
    };
  }
  
}


//  setup interface: simple
function setupInterface(){
  fullscreenButton = select("#fullscreen");
  fullscreenButton.mouseReleased(toggleFullscreen);
  pauseModelButton = select("#start");
  pauseModelButton.mousePressed(pauseModelRun);  
  restartModelButton = select("#restart");
  restartModelButton.mouseReleased(resetSketch);  
  exportDataButton = select("#export");
  exportDataButton.mouseReleased(exportData);  
  scenarioRadio = createRadio().parent("radios");
  scenarioRadio.option( 0, "Baseline").setAttribute("checked","checked");
  scenarioRadio.option( 1, "Scenario 1: Highly regulated borders");
  scenarioRadio.option( 2, "Scenario 2: Employer pays principle");
  scenarioRadio.changed(resetSketch);

  /*
  preferenceProximity = createSlider( 0, 1, 0.01, 0.01 ).parent("abm-controls");
  preferenceFees = createSlider( 0, 1, 0.02, 0.01 ).parent("abm-controls");
  preferencePassport = createSlider( 0, 1, 0.04, 0.01 ).parent("abm-controls");
  preferenceWage = createSlider( 0, 1, 0.08, 0.01 ).parent("abm-controls");
  preferenceSector = createSlider( 0, 1, 0.08, 0.01 ).parent("abm-controls");
  preferenceWorkPermit = createSlider( 0, 1, 0.08, 0.01 ).parent("abm-controls");
  preferenceSocial = createSlider( 0, 1, 0.17, 0.01 ).parent("abm-controls");
  preferenceFamily = createSlider( 0, 1, 0.25, 0.01 ).parent("abm-controls");
  preferenceNone = createSlider( 0, 1, 0.27, 0.01 ).parent("abm-controls");
  */
 
  showMigrantNuclearFamilyLinks = createCheckbox('Show Migrant • ↔ ••• Migrant Nuclear Family', migrantNuclearFamilyLinksBool).parent("checkboxes");
  showMigrantNuclearFamilyLinks.changed(function(){migrantNuclearFamilyLinksBool = !migrantNuclearFamilyLinksBool;});
  showAgencyLinks = createCheckbox('Show Recruiter ◉ → ▣ Recruitment Agency', agencyLinksBool).parent("checkboxes");
  showAgencyLinks.changed(function(){agencyLinksBool = !agencyLinksBool;});
  showIntermediaryIntermediaryLinks = createCheckbox('Show Intermediary ◉ → ◉ Intermediary', intermediaryIntermediaryLinksBool).parent("checkboxes");
  showIntermediaryIntermediaryLinks.changed(function(){intermediaryIntermediaryLinksBool = !intermediaryIntermediaryLinksBool;});
  showIntermediaryEmployerLinks = createCheckbox('Show Intermediary ◉ → ◎ Employer', intermediaryEmployerLinksBool).parent("checkboxes");
  showIntermediaryEmployerLinks.changed(function(){intermediaryEmployerLinksBool = !intermediaryEmployerLinksBool;});
  showEmployerThailandDocBrokerLinks = createCheckbox('Show Employer ◎ → ◉ Thailand Document Broker', EmployerThailandDocBrokerLinksBool).parent("checkboxes");
  showEmployerThailandDocBrokerLinks.changed(function(){EmployerThailandDocBrokerLinksBool = !EmployerThailandDocBrokerLinksBool;});

 
  /*
  let q = parse_query_string(location.search);
  verify = parseInt(q["verify"]);
  iterations = parseInt(q["iterations"]);
  start = parseInt(q["start"]);
  scenario = parseInt(q["scenario"]);
  seed = parseInt(q["seed"]);
  */
  scenario = scenarioRadio.value();
}


//  setup interface: additional
function pauseModelRun(){ 
  if( frameCount <= ticks ){
    if( isLooping() ){
      pauseModelButton.html("Continue");
      noLoop();
    }else{
      pauseModelButton.html("Pause");
      loop();
    }
  }
}
  
function arrayToVecSubarea(arrs){
  let a = arrs;
  for( const [k, v] of Object.entries( a ) ){    
    let b = [];
    for( let i=0; i<v.boundaries.length; i++ ) b.push( createVector( v.boundaries[i][0], v.boundaries[i][1] ) );
    v.boundaries = b;
  }
}
  
  
function arrayToVecProtoarea(arrs){
  let a = arrs;
  for( const [k, v] of Object.entries( a ) ) v.loc = createVector( v.loc[0], v.loc[1] ); 
}
 
function toggleFullscreen(){
  fullscreen(!fullscreen()); 
  if( fullscreen() ){
    fullscreenButton.html("Fullscreen");
  }else{
    fullscreenButton.html("Exit Fullscreen");
  }
}

//  global helper functions: financial
function bahtToFloat(b){ return map(b,configData.money.minimum,configData.money.maximum,0,1); }
function floatToBaht(f){ return map(f,0,1,configData.money.minimum,configData.money.maximum); }
