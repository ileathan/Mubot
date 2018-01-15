use re "eval"; $re="\\((?:(?>[^()]+)|(??{$re}))*\\)"; if("(lololhi)"=~$re){ print "Matched " . $& . "wtf";} else {print "Bad match"}
