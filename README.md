# easy-node-inspector

Quick-and-dirty CLI interface to node-inspector; makes it a bit easier to open the debugger.

    $ npm install -g easy-node-inspector
    $ easy-node-debug ./my-script.js

Unlike node-inspector, which requires accessing web inspector in the browser, this launches it as its own app via nw.js.
It also finds free web and debug ports, so you don't have to worry about specifying those.

# TODO list

* quickly attach to already-running node process
* list running processes and their PIDs?
  * Can use tasklist or node-ps
* Can you run two debuggers at once?
