#SSHFS
mkdir -p ~/mnt/stratus-relayer    
sshfs root@168.231.90.235:/home/ubuntu/Stratus_Relayer ~/mnt/stratus-relayer -o reconnect,ServerAliveInterval=15,ServerAliveCountMax=3,follow_symlinks,auto_cache,volname=StratusRelayer,compression=no

#Clear all ._ files
find . -type f -name '._*' -delete