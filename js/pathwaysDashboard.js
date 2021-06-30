let pathwaysDashboard = p5i => {

  let colorLines;
  let w, h, b;
  let scenarioDataSet = [];
  let pathways = [ "mou", "informal", "family", "solo" ];
  let colors = [ "#003f5c", "#FE5F58", "#00b789", "#45eb17" ];
  let colorRanges = [ p5i.color(134,43,49,60), p5i.color(19,77,62,60), p5i.color(138,80,46,60), p5i.color(22,36,71,60) ];
  let colorRangesNo = [ p5i.color(134,43,49,0), p5i.color(19,77,62,0), p5i.color(138,80,46,0), p5i.color(22,36,71,0) ];

  p5i.setup = function( ){
    p5i.createCanvas(1080, 1080);
    colorLines = { "mou":p5i.color("#003f5c"), "informal":p5i.color("#FE5F58"), "family":p5i.color("#00b789"), "solo":p5i.color("#45eb17") };
    b = 70;
    w = p5i.width - b;
    h = p5i.height - b*2;
  }


  p5i.draw = function( ){
    p5i.drawLabels();
    if( frameCount > 0 ){
      let currentMigrations = [];
      for( const [id, m] of Object.entries(migrants) ){
        for( let i=0; i<m.migrations.length; i++ ){
          let migration = m.migrations[i];
          migration.id = id;
          currentMigrations.push(migration);
        }
      }
      let rppptN  = p5i.runsPathwayPrecarityPerTick( currentMigrations, true, false );
      let sppptN = p5i.scenarioPathwayPrecarityPerTick( rppptN );
      p5i.drawPathways( sppptN, pathways, colors, colorRanges, colorRangesNo, false );
    }
  }


  p5i.runsPathwayPrecarityPerTick = function( sds, normalVal, preVal ){
      
    // prepare empty data structure
    // scenario containing summary info for each run
    // array of 1
    let scenarioPrecarityPerRun = [];
    // ticks
    let pathwayPrecarityPerTick = {};
    for( let t=1; t<=1825; t++ ){
      pathwayPrecarityPerTick[ t ] = {
        "mou"      :{ "a":0, "s":0, "c":0, "max":null, "min":null },
        "informal" :{ "a":0, "s":0, "c":0, "max":null, "min":null },
        "family"   :{ "a":0, "s":0, "c":0, "max":null, "min":null },
        "solo"     :{ "a":0, "s":0, "c":0, "max":null, "min":null }
      };
    }
    scenarioPrecarityPerRun.push( pathwayPrecarityPerTick );

    // populate data structure
    // scenario containing summary info for pathway from each run
  
    // simulation run
    for( let m=0; m<sds.length; m++ ){
      // migration 
      let migration = sds[m];
      if(migration.pathway != null){
        let t0 = null;
        for( const [ t, p ] of Object.entries( migration.history ) ){
          if(t0 == null) t0 = t-1;
          // tick 
          let rt = t -t0;
          scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].s += p.precarity;
          scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].c += 1;
          if(
            scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].min == null || 
            scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].min > p.precarity 
          ) scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].min = p.precarity;
          if(
            scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].max == null || 
            scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].max < p.precarity
          ) scenarioPrecarityPerRun[ 0 ][ rt ][ migration.pathway ].max = p.precarity;                
        }
      }
    }

    // calculate precarity average for each pathway for each tick
    let pathways = [ "mou", "informal", "family", "solo" ];
    // tick
    for( const [ t, run ] of Object.entries( scenarioPrecarityPerRun[ 0 ] ) ){
      // pathway
      for( p=0; p<pathways.length; p++ ){
        if(
          run[ pathways[p] ].c != 0 && 
          run[ pathways[p] ].c != null
        ) run[ pathways[p] ].a = run[ pathways[p] ].s / run[ pathways[p] ].c;                
      }
    }

    // average precarity score for each run for tick for each pathway
    return scenarioPrecarityPerRun;
  }


  // -----
  p5i.scenarioPathwayPrecarityPerTick = function( sds ){    
    // prepare empty data structure
    let pathwayPrecarityPerTick = {};
    for( let t=1; t<=1825; t++ ){
      pathwayPrecarityPerTick[ t ] = {
        "mou"      :{ "a":0, "s":0, "c":0, "max":null, "min":null },
        "informal" :{ "a":0, "s":0, "c":0, "max":null, "min":null },
        "family"   :{ "a":0, "s":0, "c":0, "max":null, "min":null },
        "solo"     :{ "a":0, "s":0, "c":0, "max":null, "min":null }
      };
    }

    // simulation run
    // populate data structure
    // precarity score for each tick for each pathway
    let pathways = [ "mou", "informal", "family", "solo" ];
    // tick
    for( const [ t, timeStep ] of Object.entries( sds[0] ) ){
      
      // pathway
      for( p=0; p<pathways.length; p++ ){
        if(
          timeStep[ pathways[p] ].c == 0 || 
          timeStep[ pathways[p] ].c == null
        ){
        }else{
          pathwayPrecarityPerTick[ t ][ pathways[p] ].s += timeStep[ pathways[p] ].a;
          pathwayPrecarityPerTick[ t ][ pathways[p] ].c += 1;

          if(
            pathwayPrecarityPerTick[ t ][ pathways[p] ].min == null ||
            pathwayPrecarityPerTick[ t ][ pathways[p] ].min > timeStep[ pathways[p] ].min
          ) pathwayPrecarityPerTick[ t ][ pathways[p] ].min = timeStep[ pathways[p] ].min;
                    
          if(
            pathwayPrecarityPerTick[ t ][ pathways[p] ].max == null ||
            pathwayPrecarityPerTick[ t ][ pathways[p] ].max < timeStep[ pathways[p] ].max
          ) pathwayPrecarityPerTick[ t ][ pathways[p] ].max = timeStep[ pathways[p] ].max;
        }      
      }
    }
    return pathwayPrecarityPerTick;
  }


  p5i.drawPathways = function( sps, pathways, colors, colorRanges, colorRangesOutline, showMaxMin ){
    for( p=0; p<pathways.length; p++ ){         
      p5i.push();
      p5i.stroke(colors[ p ]);
      p5i.noFill();
      for( const [ t, precarity ] of Object.entries( sps ) ){
        if( precarity[ pathways[p] ].c != 0 ){
          if(t != 1){
            let x1 = p5i.map( t-1, 1, 1825, b + 20, w + 20 );
            let y1 = p5i.map( sps[t-1][ pathways[p] ].s / sps[t-1][ pathways[p] ].c, 0, 1, h-2, b );
            let x2 = p5i.map( t, 1, 1825, b + 20, w + 20 );
            let y2 = p5i.map( precarity[ pathways[p] ].s / precarity[ pathways[p] ].c, 0, 1, h-2, b );
            p5i.strokeWeight(precarity[ pathways[p] ].c)
            p5i.strokeWeight(6)
            p5i.line( x1, y1, x2, y2);                
          }
        }
      }
    p5i.pop();
    }
  }


  p5i.drawLabels = function(){
    //chart
    p5i.background(245);
    p5i.push();
    p5i.stroke(100);
    p5i.strokeWeight(1);
    p5i.fill(100);
    p5i.textSize(20);
    p5i.translate(20,15);

    // x axis
    let sx = 5;
    p5i.textAlign(p5i.CENTER,p5i.TOP);
    p5i.line(b,h,w,h);
    for( let i=sx; i>=0; i--){
      let x = p5i.map( i, 0, sx, b, w );
      let y = p5i.map( i, 0, sx, b, h );
      p5i.line(x,h,x,h+5);
      if(i!=0) p5i.text(i,x,h+10)
    }
    for( let i=0; i<pathways.length; i++){
      p5i.push();
      p5i.textAlign(p5i.LEFT);
      p5i.fill( "#000" );
      p5i.text( pathways[i], i*140 + 100, p5i.height - 70  )
      p5i.fill( colors[i] );
      p5i.ellipse( i*140 + 80, p5i.height-60, 20, 20);
      p5i.fill( "#000" );
      p5i.pop();
    }

    // y axis
    let sy = 4;
    p5i.textAlign(p5i.RIGHT,p5i.TOP);
    p5i.line(b,b,b,h);
    for( let i=sy; i>=0; i--){
      let x = p5i.map( i, 0, sy, w, b );
      let y = p5i.map( i, 0, sy, h, b );
      p5i.line(b,y,b-5,y);
      if(i!=0) p5i.text(i*0.25,b-10,y-5)
    }

    // labels
    p5i.translate(-5,5);
    p5i.textAlign(p5i.RIGHT,p5i.TOP);
    p5i.fill(100);
    p5i.text("0",b,h+5);
    p5i.text("Years",w+5,h+b*0.75);
    p5i.textAlign(p5i.CENTER,p5i.TOP);
    p5i.push();
    p5i.translate(b - 15, b*0.5);
    p5i.textAlign(p5i.LEFT,p5i.CENTER);
    p5i.fill(100);
    p5i.text("Precarity",0,-b*0.25);
    p5i.pop();
    p5i.pop();
  }
}

let pathwaysPrecarity = new p5(pathwaysDashboard,'abm-pathway-precarity');




