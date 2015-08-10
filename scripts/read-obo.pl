use strict;
use warnings;

use Data::Dumper;
use GO::Parser;


my $parser = new GO::Parser({handler=>'obj',use_cache=>1});

$parser->parse($ARGV[0]);

my $graph = $parser->handler->graph;
$graph->iterate(sub {
	my $ni=shift;
	if($ni->{'term'}->{'is_root'} && !$ni->{'term'}->{'is_obsolete'} && !$ni->{'term'}->{'is_relationship_type'}) {
		print "{ \"id\": \"".qq($ni->{'term'}->{'acc'})."\", \"name\":\"".qq($ni->{'term'}->{'name'})."\" },\n";
	}
	if(!$ni->{'term'}->{'is_root'} && !$ni->{'term'}->{'is_obsolete'} && !$ni->{'term'}->{'is_relationship_type'}) {
		print "{ \"id\": \"".qq($ni->{'term'}->{'acc'})."\", \"name\":'".qq($ni->{'term'}->{'name'}."\", parent: \"".$ni->{'parent_rel'}->{'acc1'})."\" },\n";
	}
});

