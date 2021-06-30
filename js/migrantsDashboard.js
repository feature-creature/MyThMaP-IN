/*
 * Migration Pathways Descriptives
 *
 */

let migrationPathwaysDescriptives = p5i => {
  p5i.disableFriendlyErrors = true;

  var pause = false;
  var fr = 30;
  var wEnv = 1920;
  var hEnv = 250;

  p5i.setup = function() {
    var canvas = p5i.createCanvas(wEnv, hEnv,p5i.P2D);
    p5i.frameRate(fr);
    p5i.textSize(22);
    p5i.background(175);
    p5i.drawEnvironment();
  }


  p5i.draw = function() {
    p5i.drawEnvironment();
    p5i.drawTrendlines();
    p5i.drawLabels();
    //if(abm.logMigrantStates.length == abm.ticks)p5i.noLoop();
  }


  p5i.drawEnvironment = function(){
    p5i.background("#f5f5f5");
    p5i.push();
    p5i.pop();
  }


  p5i.drawLabels = function(){

    p5i.push();
      p5i.textAlign(p5i.LEFT);
      p5i.translate(5,0);
      p5i.text("0",0,hEnv-7);
      p5i.text(1000,0,hEnv-190);
      p5i.textAlign(p5i.RIGHT);
      p5i.text(frameCount +" / "+ 1825,wEnv-12,hEnv-7);
    p5i.pop();
    
    p5i.push();
      p5i.fill("#f5f5f5");
      p5i.rect(0,0,wEnv,35);
    p5i.pop();

    if( frameCount > 0 ){
      p5i.push();
        p5i.textAlign(p5i.RIGHT);
        p5i.translate(0,25);

        p5i.push();
          p5i.textAlign(LEFT);
          p5i.translate(10,0);
          p5i.stroke("#000");
          p5i.fill("#000");
          p5i.text("Migrants", 0, 0);
        p5i.pop();
      
        p5i.push();
          p5i.translate(wEnv*0.26,0);
          p5i.text(outputData[ frameCount ].s.premigration + " Premigration", 0, 0);
          p5i.strokeWeight(10);
          p5i.stroke("#3b40e3");
          p5i.line(17, -8, 57, -8);
          p5i.stroke("#000");
          p5i.fill("#000");
          p5i.ellipse(17,-8,15,15);
        p5i.pop();
      
        p5i.push();
          p5i.translate(wEnv * 0.492,0);
          p5i.text(outputData[ frameCount ].s.planning + " Planning", 0, 0);
          p5i.strokeWeight(10);
          p5i.stroke("#eb5b56");
          p5i.line(17, -8, 57, -8);
          p5i.stroke("#000");
          p5i.fill("#000");
          p5i.ellipse(17,-8,15,15);
        p5i.pop();

        p5i.push();
          p5i.translate(wEnv * 0.75,0);
          p5i.text(outputData[ frameCount ].s.transit + " Transit", 0, 0);
          p5i.strokeWeight(10);
          p5i.stroke("#5ac4be");
          p5i.line(17, -8, 57, -8);
          p5i.stroke("#000");
          p5i.fill("#000");
          p5i.ellipse(17,-8,15,15);
        p5i.pop();

        p5i.push();
          p5i.translate(wEnv -70,0);
          p5i.text(outputData[ frameCount ].s.employed+ " Employed", 0, 0);
          p5i.strokeWeight(10);
          p5i.stroke("#74ec39");
          p5i.line(17, -8, 57, -8);
          p5i.stroke("#000");
          p5i.fill("#000");
          p5i.ellipse(17,-8,15,15);
        p5i.pop();

      p5i.pop();
    }
  }


  p5i.drawTrendlines = function(){
    p5i.push();
      p5i.translate(10,hEnv-35);
      p5i.line(-2,0,-2,-145);
      p5i.line(-2,2,wEnv-20,2);

      if(frameCount > 0){
        //--- EMPLOYED
        p5i.push();
          p5i.fill("#74ec39");
          p5i.noStroke();
          p5i.beginShape();
          p5i.vertex(0,-145);
          for( const [t, v] of Object.entries( outputData ) ){
            if( t <= frameCount ){
              p5i.vertex(
                (wEnv-20)/1826*(t), 
                p5i.map(v.s.employed + v.s.transit + v.s.planning + v.s.premigration,0,1000,0,-145)
              );
            }else{
              break;
            }
          }
          p5i.vertex((wEnv-20)/1825*(frameCount), 0);
          p5i.vertex(0,0);
          p5i.endShape(p5i.CLOSE);
        p5i.pop();

        //--- TRANSIT 
        p5i.push();
          p5i.fill("#5ac4be");
          p5i.noStroke();
          p5i.beginShape();
          p5i.vertex(0,-145);
          for( const [t, v] of Object.entries( outputData ) ){
            if( t <= frameCount ){
              p5i.vertex(
                (wEnv-20)/1826*(t), 
                p5i.map(v.s.transit + v.s.planning + v.s.premigration,0,1000,0,-145)
              );
            }else{
              break;
            }
          }
          p5i.vertex((wEnv-20)/1825*(frameCount), 0);
          p5i.vertex(0,0);
          p5i.endShape(p5i.CLOSE);
        p5i.pop();


        //--- PLANNING
        p5i.push();
          p5i.fill("#eb5b56");
          p5i.noStroke();
          p5i.beginShape();
          p5i.vertex(0,-145);
          for( const [t, v] of Object.entries( outputData ) ){
            if( t <= frameCount ){
              p5i.vertex(
                (wEnv-20)/1826*(t), 
                p5i.map(v.s.planning + v.s.premigration,0,1000,0,-145)
              );
            }else{
              break;
            }
          }
          p5i.vertex((wEnv-20)/1825*(frameCount), 0);
          p5i.vertex(0,0);
          p5i.endShape(p5i.CLOSE);
        p5i.pop();


        //--- PREMIGRATION 
        p5i.push();
          p5i.fill("#3b40e3");
          p5i.noStroke();
          p5i.beginShape();
          p5i.vertex(0,-145);
          for( const [t, v] of Object.entries( outputData ) ){
            if( t <= frameCount ){
              p5i.vertex(
                (wEnv-20)/1826*(t), 
                p5i.map(v.s.premigration,0,1000,0,-145)
              );
            }else{
              break;
            }
          }
          p5i.vertex((wEnv-20)/1825*(frameCount), 0);
          p5i.vertex(0,0);
          p5i.endShape(p5i.CLOSE);
        p5i.pop();
      p5i.pop();
    }
  }


  p5i.pauseSketch = function(){
    pause = pause ? false : true;
    pause?p5i.noLoop():p5i.loop();
  }

}


let descriptives = new p5(migrationPathwaysDescriptives,'abm-data');
