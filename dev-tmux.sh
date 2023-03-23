#! /bin/sh
SESSION="simple-directory"
WINDOW="$SESSION:0"

tmux kill-session -t $SESSION

tmux new-session -d -s $SESSION

tmux split-window -t $WINDOW
tmux selectp -t $WINDOW.1 -T Client
tmux send-keys -t $WINDOW.1 "xdg-open http://localhost:5689/simple-directory && npm run dev-client" C-m

tmux split-window -h -t $WINDOW
tmux send-keys -t $WINDOW.2 'npm run dev-deps && npm run dev-server' C-m
  
tmux selectp -t $WINDOW.0

tmux attach-session -t $SESSION:0