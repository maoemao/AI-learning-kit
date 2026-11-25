import { StateGraph,Annotation,START,END,MemorySaver,interrupt,Command } from '@langchain/langgraph';
const State=Annotation.Root({question:Annotation<string>(),version:Annotation<string>()});
export const nodeRuns={count:0};
export function buildGraph(){
 return new StateGraph(State).addNode('clarify',s=>{
   nodeRuns.count++; // Runs again on resume: put external side effects in separate idempotent nodes.
   const version=s.version||interrupt('Confirm version: 2.11.8');
   if(version!=='2.11.8')throw Error('UNSUPPORTED_VERSION');
   return {version};
 }).addEdge(START,'clarify').addEdge('clarify',END).compile({checkpointer:new MemorySaver()});
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/graph.js')){
 const g=buildGraph(),config={configurable:{thread_id:'demo-27'}};
 console.log(await g.invoke({question:'Button loading default?'},config));
 console.log(await g.invoke(new Command({resume:'2.11.8'}),config));
 console.log({nodeRuns:nodeRuns.count,note:'MemorySaver is RAM-only; restart loses checkpoints.'});
}
